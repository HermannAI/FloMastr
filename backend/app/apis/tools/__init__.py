


from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Dict, Any
import requests
import hashlib
import json
import io
from PyPDF2 import PdfReader
from openai import OpenAI
import databutton as db
from app.libs.backend_auth import require_backend_token

router = APIRouter(prefix="/tools")

# OpenAI client
client = OpenAI(api_key=db.secrets.get("OPENAI_API_KEY"))

# Models
class ConvertUrlRequest(BaseModel):
    url: HttpUrl

class ConvertResponse(BaseModel):
    markdown: str
    title: str

class EmbedRequest(BaseModel):
    texts: List[str]

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]

class ConvertFileResponse(BaseModel):
    markdown: str

class TextItem(BaseModel):
    text: str = Field(..., title="Text content of the knowledge chunk")
    chunk_id: str = Field(None)
    distance: float = Field(None)

class ContextResponse(BaseModel):
    context: str

class SynthesisInput(BaseModel):
    query: str = Field(..., title="User's text query")
    context: str = Field(..., title="Context to use for synthesis")

class AnswerResponse(BaseModel):
    answer: str

@router.post("/synthesis")
async def synthesize(
    request: Request,
    data: SynthesisInput,
    _: str = Depends(require_backend_token)
) -> AnswerResponse:
    """
    Dedicated synthesis endpoint that bypasses reverse proxy routing issues.
    Generates coherent, natural-language answers based on provided context and user query.
    Uses OpenAI GPT-4 to synthesize answers using only the provided context.
    """
    # System prompt to instruct the LLM to act as a knowledge assistant
    system_prompt = (
        "You are a helpful knowledge assistant. Your task is to provide a concise and direct answer to the user's question. "
        "The user will provide a question and a block of context. "
        "You must answer the question using ONLY the information provided in the context. "
        "If the context does not contain the answer, state that you cannot answer based on the provided information. "
        "Do not use any prior knowledge. Do not make up any information. "
        "Answer in a professional and helpful tone."
    )

    # Combine the user query and context into the message history
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context:\n{data.context}\n\nQuestion:\n{data.query}"}
    ]

    try:
        # Call the OpenAI API to generate the response
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.0  # Set to 0.0 for deterministic, factual responses
        )
        
        # Extract the answer from the API response
        answer = response.choices[0].message.content
        return AnswerResponse(answer=answer)

    except Exception as e:
        # Handle API errors gracefully
        print(f"OpenAI API error in synthesize: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI synthesis failed: {str(e)}")

@router.post("/generate/answer")
async def generate_answer(
    request: Request,
    data: SynthesisInput,
    _: str = Depends(require_backend_token)
) -> AnswerResponse:
    """
    Generates a coherent, natural-language answer based on provided context and user query.
    Uses OpenAI GPT-4 to synthesize answers using only the provided context.
    """
    # System prompt to instruct the LLM to act as a knowledge assistant
    system_prompt = (
        "You are a helpful knowledge assistant. Your task is to provide a concise and direct answer to the user's question. "
        "The user will provide a question and a block of context. "
        "You must answer the question using ONLY the information provided in the context. "
        "If the context does not contain the answer, state that you cannot answer based on the provided information. "
        "Do not use any prior knowledge. Do not make up any information. "
        "Answer in a professional and helpful tone."
    )

    # Combine the user query and context into the message history
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context:\n{data.context}\n\nQuestion:\n{data.query}"}
    ]

    try:
        # Call the OpenAI API to generate the response
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using gpt-4o-mini for cost efficiency
            messages=messages,
            temperature=0.0  # Set to 0.0 for deterministic, factual responses
        )
        
        # Extract the answer from the API response
        answer = response.choices[0].message.content
        return AnswerResponse(answer=answer)

    except Exception as e:
        # Handle API errors gracefully
        print(f"OpenAI API error in generate_answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@router.post("/prepare/context")
async def prepare_context(
    request: Request,
    items: List[TextItem],
    _: str = Depends(require_backend_token)
) -> ContextResponse:
    """
    Combines an array of knowledge chunks into a single, cohesive context string.
    Each chunk is separated by a delimiter for clear delineation.
    """
    # Extract the text from each item and join them with a separator
    context_string = "\n\n---\n\n".join([item.text for item in items])
    
    # Return a JSON object with the combined context
    return ContextResponse(context=context_string)

@router.post("/convert/file-to-md")
async def convert_file_to_md(
    request: Request,
    file: UploadFile,
    _: str = Depends(require_backend_token)
) -> ConvertFileResponse:
    """
    Accepts a file upload, extracts text, and returns it as markdown.
    """
    # --- START TEMPORARY DEBUGGING CODE ---
    server_secret_key = db.secrets.get("BACKEND_API_SECRET_TOKEN")
    incoming_header = request.headers.get("Authorization")
    print("--- START AUTH DEBUG ---")
    print(f"SERVER_SECRET_KEY_LOADED: {server_secret_key}")
    print(f"INCOMING_HEADER_RECEIVED: {incoming_header}")
    if incoming_header:
        incoming_token = incoming_header.split(" ")[1] if " " in incoming_header else incoming_header
        print(f"ARE_THEY_EQUAL?: {server_secret_key == incoming_token}")
    print("--- END AUTH DEBUG ---")
    # --- END TEMPORARY DEBUGGING CODE ---
    
    try:
        # Read the file content into memory
        contents = await file.read()
        filename = file.filename or ""
        
        # Determine file type by extension and process accordingly
        text_content = ""
        
        if filename.lower().endswith('.pdf'):
            try:
                pdf_file = io.BytesIO(contents)
                pdf_reader = PdfReader(pdf_file)
                for page in pdf_reader.pages:
                    text_content += page.extract_text() + "\n"
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Could not extract content from PDF: {str(e)}")
                
        elif filename.lower().endswith(('.txt', '.md', '.csv', '.json', '.xml', '.html')):
            try:
                text_content = contents.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text_content = contents.decode('latin-1')
                except Exception as e:
                    raise HTTPException(status_code=422, detail=f"Could not decode text file: {str(e)}")
        
        elif filename.lower().endswith(('.docx', '.doc')):
            raise HTTPException(status_code=422, detail="Word document support requires additional configuration.")
        
        else:
            try:
                text_content = contents.decode('utf-8')
            except UnicodeDecodeError:
                raise HTTPException(status_code=422, detail=f"Unsupported file type: {filename}")
        
        text_content = text_content.strip()
        
        if not text_content:
            raise HTTPException(status_code=422, detail="Could not extract any text content from the file.")
        
        return ConvertFileResponse(markdown=text_content)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during file processing: {str(e)}")

@router.post("/convert/url-to-md")
async def convert_url_to_markdown(
    request_body: ConvertUrlRequest,
    _: str = Depends(require_backend_token)
) -> ConvertResponse:
    """Convert URL to markdown"""
    try:
        response = requests.get(str(request_body.url), timeout=10)
        response.raise_for_status()
        
        content = response.text
        
        return ConvertResponse(
            markdown=f"# Content from {request_body.url}\n\n{content[:1000]}...",
            title=f"Content from {request_body.url}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"URL conversion failed: {str(e)}")

@router.post("/embed/knowledge")
async def embed_knowledge(
    request_body: EmbedRequest,
    _: str = Depends(require_backend_token)
) -> EmbedResponse:
    """Generate embeddings for knowledge content"""
    try:
        response = client.embeddings.create(
            model="text-embedding-3-large",
            input=request_body.texts
        )
        
        embeddings = [embedding.embedding for embedding in response.data]
        
        return EmbedResponse(embeddings=embeddings)
        
    except Exception as e:
        print(f"Embedding error: {str(e)}")
        dummy_embeddings = [[0.0] * 3072 for _ in request_body.texts]
        return EmbedResponse(embeddings=dummy_embeddings)
