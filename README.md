# AI Doprava

AI Doprava is a cutting-edge demo project that leverages the power of Next.js, TypeScript, and Tailwind CSS, with components from Shadcn/UI, to provide real-time information from the Czech police regarding Czech roads directly through an interactive chatbot. This project integrates with the OpenAI API for natural language processing and uses Clerk for authentication, ensuring secure access to the application. Deployed on Vercel, AI Doprava aims to make road information from the Czech Republic easily accessible and interactive.

## Demo

Experience AI Doprava in action:
- **Domain:** [https://ai-chat-demo-delta.vercel.app/](https://ai-chat-demo-delta.vercel.app/)
- **Demo Account:**
  - Username: `demouser`
  - Password: `demopassword`

_Please note: The OpenAI API is a paid service, and this demo is intended for learning and demonstration purposes. We kindly ask you to use the demo account judiciously to avoid unnecessary API costs._

## Features

- **Real-time Road Information:** Fetches and visualizes the latest road conditions and incidents reported by the Czech police.
- **Interactive Chatbot:** Communicate with the AI to ask questions and receive updates about road conditions in the Czech Republic.
- **Secure Authentication:** Utilizes Clerk for secure user authentication.
- **Modern Tech Stack:** Built with Next.js, TypeScript, and Tailwind CSS for a responsive and user-friendly interface.
- **Deployment:** Fully deployed on Vercel for high availability and performance.

## Technology Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, Shadcn/UI for UI components
- **Backend:** Connected to the OpenAI API for processing natural language queries
- **Authentication:** Clerk
- **Deployment:** Vercel

## Getting Started

To get started with AI Doprava, follow these steps:

1. **Clone the repository**

   ```bash
   git clone https://github.com/ViktorSivek/ai_chat_demo

2. **Install dependencies**

   ```bash
   npm install

3. **Set up environment variables**

   Create a .env.local file in the root directory and add your OpenAI API key and Clerk         credentials:
   ```bash
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_CLERK_FRONTEND_API=your_clerk_frontend_api

4. **Run the development server**

   Open http://localhost:3000 with your browser to see the result.
   ```bash
   npm run dev

## Contributing

AI Doprava is open for contributions. Whether you're looking to fix bugs, improve the documentation, or add new features, we welcome your pull requests and issues on GitHub.
   
