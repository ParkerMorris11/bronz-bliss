import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        The page you're looking for doesn't exist.
      </p>
      <Link href="/">
        <Button variant="secondary" data-testid="button-go-home">Go to Dashboard</Button>
      </Link>
    </div>
  );
}
