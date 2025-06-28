"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function GeminiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSeen, setIsSeen] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // const [waiting, isWaiting] = useState(true)

  function parseMarkdownJson(markdownJson: string) {
    // Remove starting and ending triple backtick lines
    const cleaned = markdownJson
      .replace(/^```json\s*/i, '')  // remove starting ```json
      .replace(/```$/, '')          // remove ending ```
      .trim();

    return JSON.parse(cleaned);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }
    
    setMessages((prev) => [...prev, userMessage])
    setError(null)
    
    setInput("");
    setIsSeen("Sending");

    // Wait for 3 seconds, but abort if user types something
    let aborted = false;
    const inputListener = (e: Event) => {
      aborted = true;
    };

    // Listen for input changes
    const inputElement = document.querySelector('input');
    inputElement?.addEventListener('input', inputListener);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    inputElement?.removeEventListener('input', inputListener);

    if (aborted) {
      setIsSeen("Sent");
      return;
    }

    setIsSeen("Seen");

    setIsLoading(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      let data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to get response")
      }

      // Parse the JSON string in data.message
      let parsed = parseMarkdownJson(data.message)

      console.log(parsed)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: parsed.ai || "",
        timestamp: new Date(),
      }

      if (assistantMessage.content.length > 0) {
        setMessages((prev) => [...prev, assistantMessage])
      }


    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === "string") {
        setError(err)
      } else {
        setError("Something went wrong")
      }
    } finally {
      setIsLoading(false)
      setIsSeen("Seen")
    }
    
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="h-[95vh] flex flex-col shadow-lg">
          <CardHeader className="border-b bg-white/50 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              Emotion AI
            </CardTitle>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                Clear Chat
              </Button>
            )}
          </CardHeader>

          <CardContent className="flex-1 p-0 h-full overflow-hidden">
            <ScrollArea className="h-full p-4">
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Welcome to Emotion AI!</p>
                    <p className="text-sm mt-2">Start a conversation to test the AI</p>
                    <div className="mt-4 text-xs text-gray-400">
                      <p>Try asking: "Explain how AI works" or "Write a short poem"</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-purple-100">
                            <Bot className="w-4 h-4 text-purple-600" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${message.role === "user" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-800 border"
                          }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        <p
                          className={`text-xs mt-2 opacity-70 ${message.role === "user" ? "text-purple-100" : "text-gray-500"
                            }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>

                      {message.role === "user" && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-green-100">
                            <User className="w-4 h-4 text-green-600" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div className="relative">
                    {messages[messages.length - 1].role === 'user' && <p className="text-xs text-muted-foreground text-right pr-12 m-0 absolute -top-4 right-0">{isSeen}</p>}
                  </div>


                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-purple-100">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 border rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t bg-white/50 p-4">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type here"
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
