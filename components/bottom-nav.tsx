"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, TrendingDown, Settings } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Geral", icon: LayoutDashboard },
    { href: "/ganhos", label: "Ganhos", icon: TrendingUp },
    { href: "/despesas", label: "Despesas", icon: TrendingDown },
    { href: "/config", label: "Ajustes", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around py-2 px-4 shadow-lg pointer-events-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 select-none ${
                isActive
                  ? "text-accent-primary scale-105 font-medium"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className={`p-1 rounded-xl transition-all duration-200 ${
                isActive ? "bg-accent-primary/10 text-accent-primary" : "bg-transparent"
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] mt-1 tracking-wide">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
