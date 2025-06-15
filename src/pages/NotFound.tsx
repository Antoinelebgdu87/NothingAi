import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-8xl font-bold gradient-text">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground">
            Oops! The page you're looking for doesn't exist. Let's get you back
            to the conversation.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Button asChild className="rounded-xl px-6 py-3">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to NothingAI</span>
            </Link>
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="pt-8 opacity-20">
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
