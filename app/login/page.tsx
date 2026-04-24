import { Leaf } from "lucide-react";
import { login } from "@/actions/auth";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-mint text-leaf">
            <Leaf className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink">Biolaur CRM</h1>
            <p className="text-sm text-slate-500">Connexion commercial terrain</p>
          </div>
        </div>
        <form action={login} className="space-y-4">
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input name="email" type="email" required className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</span>
            <input name="password" type="password" required className="focus-ring h-10 w-full rounded-md border border-line px-3 text-sm" />
          </label>
          <button className="focus-ring w-full rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white">Se connecter</button>
        </form>
        <p className="mt-4 text-xs text-slate-500">Utilisez vos identifiants Supabase pour acceder au CRM.</p>
      </div>
    </main>
  );
}
