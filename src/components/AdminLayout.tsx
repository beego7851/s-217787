import { Link, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserCheck, ClipboardList, Database, DollarSign, UserCircle, ChevronDown, HeadsetIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "./ui/use-toast";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/admin" },
  { icon: Users, label: "Members", to: "/admin/members" },
  { icon: UserCheck, label: "Collectors", to: "/admin/collectors" },
  { icon: ClipboardList, label: "Registrations", to: "/admin/registrations" },
  { icon: Database, label: "Database", to: "/admin/database" },
  { icon: DollarSign, label: "Finance", to: "/admin/finance" },
  { icon: HeadsetIcon, label: "Support Tickets", to: "/admin/support" },
  { icon: UserCircle, label: "Profile", to: "/admin/profile" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          setIsLoggedIn(false);
          navigate("/login");
          return;
        }

        if (!session) {
          setIsLoggedIn(false);
          navigate("/login");
          return;
        }

        // Verify the user still exists
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("User verification error:", userError);
          try {
            // Try to sign out, but don't wait for it
            supabase.auth.signOut().catch(e => console.error("Sign out error:", e));
          } finally {
            setIsLoggedIn(false);
            navigate("/login");
            toast({
              title: "Session expired",
              description: "Please log in again",
              variant: "destructive",
            });
          }
          return;
        }

        setIsLoggedIn(true);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoggedIn(false);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);
      
      if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        navigate("/login");
      } else if (event === "SIGNED_IN" && session) {
        setIsLoggedIn(true);
      } else if (event === "TOKEN_REFRESHED") {
        // Verify the refreshed session is still valid
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          try {
            // Try to sign out, but don't wait for it
            supabase.auth.signOut().catch(e => console.error("Sign out error:", e));
          } finally {
            setIsLoggedIn(false);
            navigate("/login");
            toast({
              title: "Session expired",
              description: "Please log in again",
              variant: "destructive",
            });
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="w-full justify-between h-12"
              >
                <span className="font-semibold">Menu</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-[calc(1400px-4rem)]">
              {menuItems.map((item) => (
                <DropdownMenuItem
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className="flex items-center gap-3 cursor-pointer py-3 px-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 text-base"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main className="flex-1">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}