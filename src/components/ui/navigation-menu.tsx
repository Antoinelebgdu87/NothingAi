import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Settings,
  Download,
  Upload,
  Trash2,
  MoreVertical,
  FileText,
  BarChart3,
} from "lucide-react";
import { NothingAIWordmark } from "./nothingai-logo";

interface NavigationMenuProps {
  onExportData?: () => void;
  onImportData?: () => void;
  onClearData?: () => void;
  onExportChat?: () => void;
  className?: string;
}

const NavigationMenu = ({
  onExportData,
  onImportData,
  onClearData,
  onExportChat,
  className,
}: NavigationMenuProps) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={cn("flex items-center justify-between", className)}>
      {/* Logo et navigation principale */}
      <div className="flex items-center space-x-6">
        <Link to="/">
          <NothingAIWordmark size="md" />
        </Link>

        <div className="hidden md:flex items-center space-x-2">
          <Link to="/">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center gap-2",
                isActive("/") && "bg-primary/10 text-primary",
              )}
            >
              <Home className="w-4 h-4" />
              Accueil
            </Button>
          </Link>

          <Link to="/settings">
            <Button
              variant={isActive("/settings") ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center gap-2",
                isActive("/settings") && "bg-primary/10 text-primary",
              )}
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </Button>
          </Link>
        </div>
      </div>

      {/* Menu actions */}
      <div className="flex items-center space-x-2">
        {/* Menu desktop */}
        <div className="hidden md:flex items-center space-x-2">
          {onExportChat && (
            <Button variant="outline" size="sm" onClick={onExportChat}>
              <FileText className="w-4 h-4 mr-2" />
              Exporter Chat
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onExportData && (
                <DropdownMenuItem onClick={onExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter Données
                </DropdownMenuItem>
              )}
              {onImportData && (
                <DropdownMenuItem onClick={onImportData}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importer Données
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onClearData && (
                <DropdownMenuItem
                  onClick={onClearData}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Effacer Tout
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Menu mobile */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/" className="flex items-center">
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onExportChat && (
                <DropdownMenuItem onClick={onExportChat}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exporter Chat
                </DropdownMenuItem>
              )}
              {onExportData && (
                <DropdownMenuItem onClick={onExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter Données
                </DropdownMenuItem>
              )}
              {onImportData && (
                <DropdownMenuItem onClick={onImportData}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importer Données
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onClearData && (
                <DropdownMenuItem
                  onClick={onClearData}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Effacer Tout
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default NavigationMenu;
