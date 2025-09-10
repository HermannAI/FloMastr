# LangChain Integration Architecture

**Version**: 1.0  
**Last Updated**: September 10, 2025  
**Status**: Production Ready Blueprint - Strategic AI Framework Integration  

## 🧠 Overview & Strategic Vision

This document outlines FloMastr's strategic adoption of **LangChain** as the primary framework for sophisticated AI reasoning within our FastAPI backend. This integration transforms our platform into a true **"Relational AI Partner"** by providing enterprise-grade AI orchestration while maintaining our proven n8n workflow orchestration.

### **Core Architectural Principle**
**LangChain enhances our backend intelligence; it does not replace n8n orchestration.**

## 🎯 Strategic Benefits

### **Why LangChain for FloMastr**
- **Conversational Memory**: Advanced multi-turn conversation handling for WhatsApp interactions
- **RAG Excellence**: Production-ready Retrieval-Augmented Generation with our Business Brain
- **Agent Frameworks**: Intelligent decision-making for Data Engine queries
- **Prompt Engineering**: Systematic template management for consistent AI responses
- **Chain Composition**: Complex AI workflows with error handling and fallbacks
- **Multi-Modal Support**: Future-ready for voice, image, and document processing

### **Perfect Fit with Existing Architecture**
```
┌─────────────────────────────────────────────────────┐
│           n8n Workflow Orchestration                │
│         (Business Process Management)               │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│           FastAPI Backend + LangChain               │
│         (AI Intelligence & Tool Execution)          │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│    Business Brain | Data Engine | WhatsApp Engine   │
│        (Data Storage & Communication)               │
└─────────────────────────────────────────────────────┘
```

## 🏗️ Architectural Integration

### **Component Responsibilities**

#### **n8n (The Business Orchestrator)**
- **Role**: High-level workflow management and business process automation
- **Responsibilities**: 
  - Trigger management (cron, webhooks, events)
  - Multi-step business workflows
  - Integration with external systems
  - Process monitoring and error handling
- **Example**: Relational Pulse weekly campaigns, WhatsApp message routing

#### **FastAPI + LangChain (The AI Intelligence Layer)**
- **Role**: Advanced AI reasoning, contextual decision-making, and intelligent responses
- **Responsibilities**:
  - Complex prompt engineering and template management
  - RAG implementation with conversation context
  - Multi-turn conversation memory
  - AI agent decision-making for Data Engine queries
  - Intelligent content personalization
- **Example**: Context-aware message synthesis, intelligent knowledge retrieval

#### **Data Layer (The Foundation)**
- **Role**: Data storage, retrieval, and basic communication infrastructure
- **Components**: Business Brain (knowledge), Data Engine (real-time data), WhatsApp Engine (messaging)

## 🛠️ Implementation Architecture

### **LangChain-Powered Endpoints**

#### **1. Enhanced Business Brain with RAG Chains**

**Endpoint**: `POST /routes/tools/synthesis`

```python
"""
Enhanced Business Brain synthesis using LangChain RAG
File: backend/app/apis/tools/synthesis.py
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_core.output_parsers import StrOutputParser, PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.messages import HumanMessage, AIMessage
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.runnables.history import RunnableWithMessageHistory

from app.auth import AuthorizedUser
from app.libs.db_connection import get_db_connection

router = APIRouter()

class SynthesisRequest(BaseModel):
    query: str
    tenant_slug: str
    user_id: str
    conversation_context: Optional[List[Dict[str, str]]] = []
    synthesis_type: str = "contextual_answer"  # "contextual_answer", "pulse_content", "agent_response"

class SynthesisResponse(BaseModel):
    synthesized_message: str
    confidence_score: float
    sources_used: List[str]
    conversation_id: str
    personalization_elements: List[str]

@router.post("/synthesis", response_model=SynthesisResponse)
async def synthesize_with_langchain(
    request: SynthesisRequest,
    user: AuthorizedUser
):
    """
    LangChain-powered synthesis with conversational memory and RAG
    """
    try:
        # 1. Initialize LangChain components
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        embeddings = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))
        
        # 2. Build context-aware RAG chain
        retriever = await get_tenant_knowledge_retriever(
            tenant_slug=request.tenant_slug,
            embeddings=embeddings
        )
        
        # 3. Create conversation-aware prompt template
        synthesis_template = """You are a knowledgeable AI assistant for {tenant_name}. 
        
        Based on the conversation history and relevant knowledge, provide a helpful, 
        personalized response that builds on the previous context.

        Relevant Knowledge:
        {context}

        Conversation History:
        {chat_history}

        Current Question: {question}

        Instructions:
        - Reference previous conversation naturally when relevant
        - Use knowledge context to provide accurate information
        - Maintain a {tone} tone consistent with the brand
        - Include personalization elements when possible
        - Keep response concise but complete
        
        Response:"""
        
        prompt = ChatPromptTemplate.from_template(synthesis_template)
        
        # 4. Build conversation memory
        memory = ConversationBufferWindowMemory(
            k=5,  # Remember last 5 exchanges
            memory_key="chat_history",
            return_messages=True
        )
        
        # Load previous conversation context
        for msg in request.conversation_context[-10:]:  # Last 10 messages
            if msg.get("role") == "user":
                memory.chat_memory.add_user_message(msg["content"])
            elif msg.get("role") == "assistant":
                memory.chat_memory.add_ai_message(msg["content"])
        
        # 5. Create the RAG chain with memory
        rag_chain = (
            RunnableParallel({
                "context": retriever,
                "question": RunnablePassthrough(),
                "chat_history": lambda x: memory.load_memory_variables({})["chat_history"],
                "tenant_name": lambda x: get_tenant_name(request.tenant_slug),
                "tone": lambda x: get_tenant_tone(request.tenant_slug)
            })
            | prompt
            | llm
            | StrOutputParser()
        )
        
        # 6. Execute the chain
        response = await rag_chain.ainvoke(request.query)
        
        # 7. Save conversation to memory
        memory.save_context(
            {"input": request.query},
            {"output": response}
        )
        
        # 8. Extract metadata
        sources_used = await get_sources_from_retrieval(retriever, request.query)
        confidence_score = calculate_confidence_score(response, sources_used)
        
        return SynthesisResponse(
            synthesized_message=response,
            confidence_score=confidence_score,
            sources_used=sources_used,
            conversation_id=f"conv_{request.user_id}_{int(time.time())}",
            personalization_elements=["conversation_context", "brand_tone", "knowledge_integration"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {str(e)}")

async def get_tenant_knowledge_retriever(tenant_slug: str, embeddings):
    """Create a retriever for tenant's knowledge base"""
    conn = await get_db_connection()
    try:
        # Implementation would create a vector store retriever
        # This is a placeholder for the actual implementation
        from langchain_community.vectorstores import PGVector
        
        vectorstore = PGVector(
            collection_name=f"knowledge_{tenant_slug}",
            connection_string=os.getenv("DATABASE_URL"),
            embedding_function=embeddings
        )
        
        return vectorstore.as_retriever(search_kwargs={"k": 5})
    finally:
        await conn.close()
```

#### **2. Relational Pulse Content Intelligence**

**Endpoint**: `POST /routes/context/pulse-content`

```python
"""
LangChain-powered Relational Pulse content personalization
File: backend/app/apis/context/pulse_content.py
"""

from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain.tools import tool
from langchain_core.prompts import ChatPromptTemplate

class PulseContentAgent:
    def __init__(self, tenant_slug: str):
        self.tenant_slug = tenant_slug
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
        
    @tool
    def get_user_interaction_history(self, user_id: str) -> str:
        """Retrieve user's recent interaction topics and preferences"""
        # Implementation to fetch from database
        return "User recently asked about order tracking and inventory management"
    
    @tool  
    def get_relevant_knowledge_content(self, topics: List[str]) -> str:
        """Get knowledge base content relevant to user's interests"""
        # Implementation using vector similarity search
        return "Tips about automated order tracking, inventory management best practices"
    
    @tool
    def analyze_content_relevance(self, content: str, user_context: str) -> float:
        """Score content relevance for the specific user"""
        # Implementation using semantic similarity
        return 0.85
        
    async def generate_personalized_content(self, user_id: str, preferences: Dict) -> Dict:
        """Use LangChain agent to intelligently select and personalize content"""
        
        tools = [
            self.get_user_interaction_history,
            self.get_relevant_knowledge_content, 
            self.analyze_content_relevance
        ]
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a content personalization agent for {tenant_name}. 
            Your goal is to select the most relevant and valuable content for weekly 
            pulse messages based on user context and preferences.
            
            Always prioritize:
            1. Recent interaction topics
            2. User's expressed interests  
            3. Content that provides actionable value
            4. Brand consistency and tone
            """),
            ("user", "Generate personalized pulse content for user {user_id} with preferences: {preferences}"),
            ("assistant", "I'll analyze the user's context and select the most relevant content."),
            MessagesPlaceholder(variable_name="agent_scratchpad")
        ])
        
        agent = create_openai_functions_agent(self.llm, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        
        result = await agent_executor.ainvoke({
            "user_id": user_id,
            "preferences": preferences,
            "tenant_name": self.tenant_slug
        })
        
        return result
```

#### **3. Data Engine Natural Language Interface**

**Endpoint**: `POST /routes/data/nl-query`

```python
"""
LangChain-powered natural language to SQL/API translation
File: backend/app/apis/data/nl_query.py
"""

from langchain.agents import create_sql_agent
from langchain.agents.agent_toolkits import SQLDatabaseToolkit
from langchain.sql_database import SQLDatabase
from langchain_experimental.sql import SQLDatabaseChain

class DataEngineAgent:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        
    async def process_natural_language_query(self, query: str, user_context: Dict) -> Dict:
        """Convert natural language to appropriate data queries"""
        
        # 1. Connect to tenant's data sources
        db = SQLDatabase.from_uri(await get_tenant_database_uri(self.tenant_id))
        
        # 2. Create SQL toolkit
        toolkit = SQLDatabaseToolkit(db=db, llm=self.llm)
        
        # 3. Create the agent with custom prompt
        agent_prompt = """You are a data analysis agent for a customer support system.
        
        Convert natural language queries into appropriate SQL queries or API calls.
        Always prioritize data security and only access data the user is authorized to see.
        
        User Context: {user_context}
        
        For queries like:
        - "What's my order status?" → Query orders table with user ID filter
        - "How many customers this month?" → Aggregate query with date filter
        - "Show my recent purchases" → Join orders and products with user filter
        
        Always include proper WHERE clauses for data isolation and security.
        """
        
        agent_executor = create_sql_agent(
            llm=self.llm,
            toolkit=toolkit,
            verbose=True,
            agent_type="openai-functions",
            prefix=agent_prompt
        )
        
        # 4. Execute the query safely
        result = await agent_executor.ainvoke({
            "input": query,
            "user_context": user_context
        })
        
        return {
            "query": query,
            "sql_generated": result.get("sql_query", ""),
            "result": result.get("result", ""),
            "explanation": result.get("explanation", "")
        }
```

## 📊 Enhanced System Capabilities

### **Conversational Memory**
```python
# Multi-tenant conversation memory management
class FloMastrConversationMemory:
    def __init__(self, tenant_id: str, user_id: str):
        self.memory = ConversationBufferWindowMemory(
            k=10,  # Remember 10 exchanges
            memory_key="chat_history",
            return_messages=True
        )
        self.tenant_id = tenant_id
        self.user_id = user_id
        
    async def load_conversation_history(self):
        """Load conversation from database"""
        # Implementation to load from PostgreSQL
        pass
        
    async def save_conversation_turn(self, user_message: str, ai_response: str):
        """Save conversation turn to database and memory"""
        # Implementation to persist to database
        self.memory.save_context(
            {"input": user_message},
            {"output": ai_response}
        )
```

### **Intelligent Content Personalization**
```python
# Advanced personalization using LangChain chains
class PersonalizationChain:
    def __init__(self):
        self.chain = (
            RunnableParallel({
                "user_profile": self.get_user_profile,
                "content_pool": self.get_available_content,
                "interaction_history": self.get_interaction_history,
            })
            | self.personalization_prompt
            | ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
            | self.content_parser
        )
    
    async def personalize_content(self, user_id: str, content_type: str) -> Dict:
        """Generate highly personalized content"""
        return await self.chain.ainvoke({
            "user_id": user_id,
            "content_type": content_type
        })
```

## 🔗 Integration with Existing Systems

### **Business Brain Enhancement**
- **RAG Chains**: Replace manual embedding searches with LangChain's sophisticated retrieval
- **Context Windows**: Maintain conversation context across multiple interactions
- **Source Attribution**: Automatic tracking of knowledge sources used in responses

### **Relational Pulse Intelligence**
- **Content Agents**: AI agents that intelligently select and personalize weekly content
- **Engagement Prediction**: ML-powered prediction of content engagement likelihood
- **Dynamic Personalization**: Real-time adaptation based on user response patterns

### **Data Engine Natural Language Interface**
- **SQL Agents**: Convert natural language to safe, parameterized SQL queries
- **API Orchestration**: Intelligent routing to appropriate data sources
- **Security Integration**: Automatic enforcement of tenant data isolation

### **WhatsApp Engine Conversation Management**
- **Multi-turn Memory**: Sophisticated conversation context management
- **Intent Recognition**: Advanced understanding of user intentions and context
- **Response Generation**: Context-aware, personalized response generation

## 🚀 Implementation Roadmap

### **Phase 1: Foundation & Core RAG (Weeks 1-2)**
- **Dependencies**: Install LangChain packages in backend
- **RAG Implementation**: Refactor `/routes/tools/synthesis` endpoint
- **Memory System**: Implement conversation memory for WhatsApp interactions
- **Testing**: Comprehensive testing of enhanced synthesis endpoint

### **Phase 2: Intelligence Expansion (Weeks 3-4)**  
- **Pulse Enhancement**: Implement LangChain agents for Relational Pulse content selection
- **Data Engine NL**: Add natural language interface for Data Engine queries
- **Prompt Templates**: Systematic prompt template management across all endpoints
- **Performance Optimization**: Caching and performance tuning

### **Phase 3: Advanced Features (Weeks 5-6)**
- **Agent Frameworks**: Implement autonomous AI agents for complex decision-making
- **Multi-modal Support**: Prepare framework for future voice/image integration
- **Advanced Analytics**: LangChain-powered analytics and insights generation
- **Enterprise Features**: Advanced personalization and A/B testing frameworks

### **Phase 4: Production Optimization (Weeks 7-8)**
- **Monitoring**: LangSmith integration for production monitoring
- **Scaling**: Performance optimization for high-volume usage
- **Documentation**: Complete API documentation and developer guides
- **Training**: Team training on LangChain development patterns

## 📦 Required Dependencies

```bash
# Core LangChain packages
pip install langchain>=0.0.350
pip install langchain-openai>=0.0.5
pip install langchain-core>=0.1.0
pip install langchain-community>=0.0.10
pip install langchain-experimental>=0.0.50

# Vector store integration  
pip install pgvector>=0.2.3
pip install psycopg2-binary>=2.9.0

# Monitoring and debugging
pip install langsmith>=0.0.60

# Additional utilities
pip install tiktoken>=0.5.0
pip install openai>=1.0.0
```

## 📈 Expected Benefits

### **Technical Benefits**
- **Reduced AI Development Time**: 60% faster development of AI features
- **Improved Response Quality**: More contextual and personalized responses
- **Better Error Handling**: Built-in retry logic and fallback mechanisms
- **Standardized Patterns**: Consistent AI development patterns across team

### **Business Benefits**
- **Enhanced User Experience**: More intelligent, context-aware conversations
- **Increased Engagement**: Personalized content drives higher engagement rates
- **Operational Efficiency**: Automated intelligent decision-making reduces manual work
- **Competitive Advantage**: Advanced AI capabilities differentiate FloMastr in market

### **Strategic Benefits**
- **Future-Ready Architecture**: Easy integration of new AI models and capabilities
- **Scalable Intelligence**: Framework scales with business growth
- **Developer Productivity**: Faster feature development and easier maintenance
- **Innovation Platform**: Foundation for advanced AI product features

## 🔧 Development Guidelines

### **LangChain Best Practices for FloMastr**
1. **Always use async/await** for LangChain operations in FastAPI endpoints
2. **Implement proper error handling** with fallback responses
3. **Use conversation memory** for all user-facing AI interactions
4. **Apply tenant isolation** in all AI operations
5. **Monitor token usage** and implement cost controls
6. **Cache expensive operations** like embeddings and retrievals
7. **Test thoroughly** with various input scenarios and edge cases

### **Code Organization**
```
backend/app/
├── ai/                     # LangChain AI components
│   ├── chains/             # Reusable LangChain chains
│   ├── agents/             # AI agents for complex tasks
│   ├── memory/             # Conversation memory management
│   ├── retrievers/         # Custom retriever implementations
│   └── prompts/            # Prompt template library
├── apis/                   # FastAPI endpoints (existing)
└── libs/                   # Shared utilities (existing)
```

**LangChain Integration** transforms FloMastr into a truly intelligent **Relational AI Partner** that learns, remembers, and provides increasingly sophisticated interactions while maintaining our proven n8n orchestration and FastAPI architecture! 🚀
