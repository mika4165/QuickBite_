import { Header } from "@/components/Header";

export default function OrderDetail() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Order Details</h1>
        <p className="text-muted-foreground mt-4">Order not found</p>
      </div>
    </div>
  );
}
