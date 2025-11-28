import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Orders() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Start by placing an order from the store menu
          </p>
        </Card>
      </main>
    </div>
  );
}
