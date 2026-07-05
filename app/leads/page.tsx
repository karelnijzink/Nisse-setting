import { listLeads } from "@/lib/data";
import { AddLeadForm } from "@/components/AddLeadForm";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusSelect } from "@/components/StatusSelect";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await listLeads();

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Leads
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {leads.length} lead{leads.length === 1 ? "" : "s"} · only call
            contacts who have consented.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <AddLeadForm />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No leads yet. Add one above.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {lead.company_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {lead.phone_number}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {lead.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect id={lead.id} current={lead.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
