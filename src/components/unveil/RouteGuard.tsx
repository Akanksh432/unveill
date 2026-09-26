import { type ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useApp, type Role } from "@/lib/app-context";
import { toast } from "sonner";

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
  fallbackTo?: string;
}

export function RouteGuard({ children, allowedRoles, fallbackTo = "/status" }: RouteGuardProps) {
  const { role } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!allowedRoles.includes(role)) {
      toast.error("403 Unauthorized", { description: "You don't have access to this area." });
      navigate({ to: fallbackTo, replace: true });
    }
  }, [role, allowedRoles, fallbackTo, navigate]);

  if (!allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
