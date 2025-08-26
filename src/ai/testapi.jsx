"use client"; 

import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * A reusable React component that fetches and displays text from the Gemini API.
 */
const GeminiComponent = () => {
  const [prompt, setPrompt] = useState("What are some of the benefits of using TypeScript?");
  const [responseText, setResponseText] = useState("Click 'Generate' to get a response...");
  const [isLoading, setIsLoading] = useState(false);

  // The API key is now handled directly by the Canvas environment for security.
  // In a real application, you would use a backend to manage API keys.
  const apiKey = "AIzaSyBsTpB_Aw4aYyt6slU0hVCFgzouNLXjkws"; 

  // Initialize the Gemini API client
  const genAI = new GoogleGenerativeAI(apiKey);

  const handleGenerate = async () => {
    // Check if the API key is available
    if (!apiKey) {
      setResponseText("API Key is not defined. Please check the setup.");
      return;
    }

    setIsLoading(true);
    setResponseText("Generating response...");

    try {
      // For text-only input, use the gemini-pro model
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setResponseText(text);
    } catch (error) {
      console.error("Error generating content:", error);
      setResponseText("An error occurred. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-xl border border-gray-200">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Gemini API Component
        </h1>
        <div className="mb-4">
          <label htmlFor="prompt" className="block text-gray-700 font-semibold mb-2">
            Enter your prompt:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            placeholder="Type your prompt here..."
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-md text-white font-bold transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isLoading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate Response'}
        </button>
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            AI-Generated Response:
          </h2>
          <div className="bg-gray-50 p-6 rounded-md border border-gray-300">
            <p className="text-gray-700 whitespace-pre-wrap">
              {responseText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App component to render the GeminiComponent
const TextApi = () => {
  return (
    <div className="font-sans antialiased text-gray-900 bg-white">
      <GeminiComponent />
    </div>
  );
};

export default TextApi;
