# FloMastr
Workflow Automation Platform
Inital Commit: 13Aug25

# 1. Core Synopsis
FloMastr is the underlying technology platform for WhappStream, a B2B SaaS product positioned as a "Proactive, AI-Powered Conversational CRM" that operates primarily through WhatsApp.

It is designed to provide industry-specific workflow automation for verticals like insurance brokers, real estate agencies, and personal coaches. The platform automates administrative tasks, manages client communication, and provides intelligent insights, allowing businesses to run more efficiently.

# 2. Brand Architecture
We will employ a "Branded Product Suite" model.

The Platform: The underlying technology is the FloMastr Platform. This is the internal name for the engine, the infrastructure, and the core automation capabilities.

The Customer-Facing Product: Is a white-labeled, unified Automation Platform hosted at https://[tenant].flomastr.com. The UI for this platform will be the central hub for all modules.

The Product Suites: Within the platform, we will sell access to specific, branded solutions (modules).

WhappStream: The flagship suite focused on Conversational CRM, WhatsApp automation, and client lifecycle management.

SocialFlo (Future): A potential future suite for AI-powered content and social media automation.

#3. Target Verticals & Key Workflows
The platform is designed to serve both vertical (industry-specific) and horizontal (cross-industry) needs.

A. Vertical: Insurance Brokers (Medical Malpractice)
24/7 Knowledge Assistant: An AI chatbot trained on regulations and policies to provide instant, context-aware answers to client questions via WhatsApp.

New Client Inquiry: A "WhatsApp-First" conversational intake process to reduce friction.

AI Quote Analyzer: An AI-powered workflow to read insurer quotes, generate a comparison summary, and present it to an agent for approval before sending to the client.

Automated Follow-Up: Proactive nudges for proposals that have not received a response.

Policy Renewal Protection: An automated system to track and create tasks for upcoming policy renewals, ensuring no recurring revenue is missed.

B. Vertical: Real Estate Agencies (Dubai)
AI-Powered Internal Listing Search: An internal tool for agents to search their agency's own property listings using natural language via WhatsApp. The AI uses vector search to find the best matches (e.g., "Show me 2br apartments with a sea view in JLT").

C. Vertical: Personal Prosperity Coaches
Daily Accountability Bot: A scheduled daily check-in to keep clients engaged and on track with their goals.

Drip Content Delivery: An automated sequence for delivering weekly lessons, videos, or audio files.

Smart Session Booker: A conversational booking and reminder system.

# 4. Technical Architecture
The platform is built on a multi-tenant, secure, and scalable cloud architecture.

Cloud Provider: Digital Ocean (DO).

Orchestration: Docker, with each tenant's n8n instance running in an isolated container.

Workflow Engine: Self-hosted n8n (Community Edition).

Backend Databases: Per-tenant, dedicated PostgreSQL databases on DO with the pgvector extension for AI capabilities.

Frontend Application: Built with Databutton.

Frontend Database: A shared Neon DB instance managed within Databutton.

Gateway: Caddy as a reverse proxy to route tenant subdomains and secure traffic with automated HTTPS.

Comms API: Twilio, using subaccounts for each tenant to ensure channel isolation.

# 5. Data Architecture
We will use a "Hot/Cold Storage" model to ensure performance, security, and scalability.

Database	Data Type	Persistence	Purpose
Shared Neon DB	Core Platform Data (Tenants, Users, Roles, Billing)	Permanent	The "Source of Truth" for the application itself.
Shared Neon DB	Workspace Data (Active Tasks, Inbox Threads, Contacts Cache)	Temporary*	The "Hot Storage" In-Tray for a fast, responsive UI.
Per-Tenant DO PostgreSQL	Tenant Business Data (All Messages, Logs, AI Knowledge)	Permanent	The "Source of Truth" for all client business data. The secure archive.

Export to Sheets
* Inbox threads are removed from Hot Storage after 14 days of inactivity via an automated housekeeping workflow. The full history always persists in Cold Storage.

# 6. HITL Frontend Design
The frontend will be a flexible, component-based UI designed for professional use.

Core Principle: The backend (n8n) will not send HTML. It will send a standardized JSON "task object" to the frontend.

The Task Object: This JSON object specifies what the UI should render. It contains a payload_components list, where each item in the list defines a UI component to display (text_content, image_preview, video_review, etc.).

Benefit: This allows for the creation of complex, multi-part tasks (e.g., reviewing text and an image in the same view) without needing to build a custom frontend page for every new workflow. It is a highly scalable and maintainable approach.

# 7. 6-Month Phased Project Plan
Phase 1 (Month 1): Foundation & Prototyping.

Goal: Master core infrastructure & build a clickable sales demo.

Milestone: A live demo to show potential clients.

Phase 2 (Months 2-3): MVP & First Client.

Goal: Build a functional MVP & sign one paying "Founding Partner."

Milestone: First revenue! A paying client is actively using the system.

Phase 3 (Months 4-5): Platformization & Growth.

Goal: Automate internal processes & prepare for efficient growth.

Milestone: Onboarding is now 80% automated.

Phase 4 (Month 6): Scaling & AI Advantage.

Goal: Launch the unique AI features & build for scale.

Milestone: FloMastr is a unique, AI-powered platform, ready for public launch.
