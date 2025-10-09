import { RouterProvider } from "react-router-dom";
import { Head } from "./internal-components/Head";
import { OuterErrorBoundary } from "./prod-components/OuterErrorBoundary";
import { router } from "./router";
import { ThemeProvider } from "./internal-components/ThemeProvider";
import { DEFAULT_THEME } from "./constants/default-theme";
import { ClerkProvider } from "@clerk/clerk-react";

// Get the Clerk Publishable Key from the environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_PROXY_URL = import.meta.env.VITE_CLERK_PROXY_URL;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

export const AppWrapper = () => {
  return (
    <OuterErrorBoundary>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        proxyUrl={CLERK_PROXY_URL}
        appearance={{
          baseTheme: undefined, // Use system theme
        }}
        // Allow Clerk to handle its own routing for auth flows
        routerPush={(to) => window.history.pushState(null, '', to)}
        routerReplace={(to) => window.history.replaceState(null, '', to)}
      >
        <ThemeProvider defaultTheme={DEFAULT_THEME}>
          <RouterProvider router={router} />
          <Head />
        </ThemeProvider>
      </ClerkProvider>
    </OuterErrorBoundary>
  );
};