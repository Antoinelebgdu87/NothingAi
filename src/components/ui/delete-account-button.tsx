import React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { simpleLicenseManager } from "@/lib/simple-license-manager";

const DeleteAccountButton = () => {
  const handleDeleteAccount = () => {
    // Supprimer complètement le compte
    simpleLicenseManager.deleteAccount();

    toast.success("Compte supprimé avec succès !", {
      description: "Redirection vers l'écran de license...",
    });

    // Recharger la page pour retourner à l'écran de license
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash className="w-4 h-4 mr-2" />
          Supprimer compte
          <AlertTriangle className="w-3 h-3 ml-auto" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Supprimer le compte
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-3">
              <p>
                <strong>Attention :</strong> Cette action va supprimer
                définitivement votre compte et toutes vos données.
              </p>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-red-800 text-sm">
                  ⚠️ <strong>Conséquences :</strong>
                </p>
                <ul className="text-red-700 text-sm mt-2 space-y-1">
                  <li>• Votre license actuelle sera révoquée</li>
                  <li>• Toutes vos conversations seront perdues</li>
                  <li>• Les images générées seront supprimées</li>
                  <li>• Une nouvelle license sera requise</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Cette action est irréversible. Êtes-vous sûr de vouloir
                continuer ?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDeleteAccount}
          >
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountButton;
