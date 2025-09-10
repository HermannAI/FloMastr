
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useClerk } from "@clerk/clerk-react";

export default function App() {
  const { signOut, user } = useClerk();
  
  // FloMastr static logo URL (same as used in Header component)
  const FLOMASTR_LOGO_URL = "https://static.databutton.com/public/15880048-1dbd-4cea-820f-d5fbc363499d/FloMastr-App.svg";

  const handleForceLogout = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error('Force logout error:', error);
    }
  };

  const handleWhatsAppTry = () => {
    // Link to WhappStream tenant's WhatsApp channel
    window.open("https://wa.me/971123456789", "_blank");
  };

  const handleTenantLogin = () => {
    // Navigate to login page using window.location for root component
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <img 
                src={FLOMASTR_LOGO_URL} 
                alt="FloMastr" 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback to WhappStream logo if FloMastr logo fails
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23009DEB'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' font-weight='bold' fill='white'%3EW%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <div>
              <span className="text-xl font-bold">WhappStream</span>
              <p className="text-sm text-muted-foreground">AI Business Partner</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Give Your Business an AI That <span className="text-[#009DEB]">Remembers</span>.
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Stop repeating yourself. WhappStream delivers intelligent answers on WhatsApp by knowing your business and remembering your customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleWhatsAppTry}
              className="bg-[#009DEB] hover:bg-[#007BC4] text-white px-8 py-3 text-lg"
              size="lg"
            >
              Try it on WhatsApp
            </Button>
            <Button 
              onClick={handleTenantLogin}
              variant="outline"
              className="border-[#009DEB] text-[#009DEB] hover:bg-[#009DEB] hover:text-white px-8 py-3 text-lg"
              size="lg"
            >
              Tenant Login
            </Button>
            {user && (
              <Button 
                onClick={handleForceLogout}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-8 py-3 text-lg"
                size="lg"
              >
                Force Logout (Test)
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Your Customers Deserve More Than "I don't understand."
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Generic chatbots frustrate customers and waste time. They forget past conversations, don't understand your business, and treat every loyal customer like a stranger. It's a broken experience.
          </p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            WhappStream is different. It's built with a <span className="text-[#009DEB]">memory</span>.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 mt-16">
            {/* Feature 1 */}
            <Card className="p-8 text-left">
              <CardContent className="space-y-4 p-0">
                <div className="mb-4">
                  <img 
                    src="https://static.databutton.com/public/15880048-1dbd-4cea-820f-d5fbc363499d/Business Brain.png" 
                    alt="Business Brain" 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h3 className="text-2xl font-bold">
                  First, Build Your Business Brain.
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Effortlessly teach your AI the ins and outs of your business. Paste documents, add website links, and upload FAQs. You teach it once, and it remembers forever, ensuring every answer is accurate and consistent with your brand.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 text-left">
              <CardContent className="space-y-4 p-0">
                <div className="mb-4">
                  <img 
                    src="https://static.databutton.com/public/15880048-1dbd-4cea-820f-d5fbc363499d/Whapp Stream.png" 
                    alt="WhappStream Customer Memory" 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h3 className="text-2xl font-bold">
                  Second, It Remembers Every Customer.
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  WhappStream learns from every conversation. It builds a relational memory of each customer, understanding their history, preferences, and needs. This transforms generic interactions into personalized, meaningful relationships.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Experience the Difference.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Ready to see what a conversation with a truly intelligent AI feels like? No forms, no sign-up. Just start a chat.
          </p>
          <Button 
            onClick={handleWhatsAppTry}
            className="bg-[#009DEB] hover:bg-[#007BC4] text-white px-8 py-3 text-lg"
            size="lg"
          >
            Try it on WhatsApp
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 ChangeMastr FZ-LLC, RAKEZ, UAE. All rights reserved. WhappStream is not affiliated with Meta, Facebook, or WhatsApp.
          </p>
        </div>
      </footer>
    </div>
  );
}
