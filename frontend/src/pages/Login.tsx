


import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">F</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome to FloMastr</h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>

        <SignIn
          routing="path"
          path="/login"
          fallbackRedirectUrl="/auth/redirect"
          appearance={{
            elements: {
              card: "shadow-lg",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              formButtonPrimary: "bg-[#009DEB] hover:bg-[#007BC4] text-white",
              footerActionLink: "text-[#009DEB] hover:underline"
            }
          }}
        />
      </div>
    </div>
  );
}
