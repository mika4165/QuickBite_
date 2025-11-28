import { Header } from "@/components/Header";

export default function Messages() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-4">No messages yet</p>
      </div>
    </div>
  );
}
