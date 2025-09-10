// /src/app/admin/call/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Download, Eye, Trash2, FileDown, X, MessageSquareMore } from "lucide-react";
import { useRouter } from "next/navigation";

type Role = "sudo" | "admin";
type Me = { id: string; role: Role; name?: string | null; username: string; permissions: string[]; status?: string | null; };

type AdminLite = { id: string; role: Role; username: string; name?: string | null; status?: string | null; };

type CallRow = {
  id: string;
  senderId: string; senderUsername: string; senderRole: Role;
  receiverId: string; receiverUsername: string; receiverRole: Role;
  fileName: string; storedName: string; mimeType?: string | null;
  remark?: string | null; lastRemark?: string | null;
  status: "active" | "deleted";
  createdAt: string;
};

/* ---------- Perm helpers (alias-aware) ---------- */
const hasCI = (list: string[] | undefined, perm: string) =>
  (list || []).some(p => p?.toLowerCase?.() === perm.toLowerCase());

// create==upload, read==view/download/page_view, update==edit, remove==delete
const PERM_ALIASES: Record<string, string[]> = {
  "call:upload":   ["call:create"],
  "call:view":     ["call:read"],
  "call:download": ["call:read"],
  "call:page_view":["call:read"],
  "call:edit":     ["call:update"],
  "call:delete":   ["call:remove"],
};
const hasWithAliases = (perms: string[] | undefined, need: string) =>
  hasCI(perms, need) || (PERM_ALIASES[need] || []).some(a => hasCI(perms, a));

/* ---- tiny UI helpers ---- */
const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={"w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm " + (p.className || "")}/>
);
const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={"w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm " + (p.className || "")}/>
);

/* ---- Upload Modal ---- */
function UploadModal({
  open, me, onClose, onUploaded
}: { open: boolean; me: Me | null; onClose: () => void; onUploaded: () => void; }) {
  const [admins, setAdmins] = useState<AdminLite[]>([]);
  const [receiverId, setReceiverId] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const r = await fetch("/api/admin/call?op=bootstrap", { credentials: "include", cache: "no-store" });
        if (!r.ok) throw new Error();
        const list: AdminLite[] = await r.json();
        const filtered = list.filter((a) => a.id !== me?.id && a.status !== "inactive");
        setAdmins(filtered);
        if (filtered.length > 0) setReceiverId(filtered[0].id);
      } catch { setAdmins([]); }
    })();
  }, [open, me?.id]);

  useEffect(() => {
    if (!open) {
      setReceiverId(""); setRemark(""); setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  async function doUpload() {
    if (!receiverId) return alert("Please select a receiver.");
    if (!file) return alert("Please choose a file.");
    if (file.size > 100 * 1024 * 1024) return alert("File size must be ≤ 100 MB.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("receiverId", receiverId);
      fd.append("remark", remark);
      fd.append("file", file);
      const r = await fetch("/api/admin/call?op=upload", { method: "POST", body: fd, credentials: "include" });
      if (!r.ok) throw new Error((await r.json().catch(()=>({}))).error || "Upload failed");
      onUploaded(); onClose();
    } catch (e:any) { alert(e?.message || "Upload failed"); }
    finally { setBusy(false); }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-xl relative">
        <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" onClick={onClose} disabled={busy}><X size={18} /></button>
        <div className="p-5 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold">Upload & Share</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Admin ↔ Admin, Admin ↔ Sudo (both ways)</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-sm mb-1">Send to</div>
            <Select value={receiverId} onChange={(e)=>setReceiverId(e.target.value)} disabled={busy}>
              {admins.length===0 && <option value="">No admins found</option>}
              {admins.map(a => <option key={a.id} value={a.id}>{a.role.toUpperCase()} — {a.name || a.username} (@{a.username})</option>)}
            </Select>
          </div>
          <div className="grid gap-2">
            <div className="text-sm">File (≤ 100 MB)</div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer w-max dark:border-gray-700">
              Choose file
              <input ref={fileInputRef} type="file" className="hidden" onChange={(e)=>setFile(e.target.files?.[0]||null)} disabled={busy}/>
            </label>
            <div className="text-xs text-gray-600 dark:text-gray-400 break-all">
              {file ? `${file.name} — ${(file.size/(1024*1024)).toFixed(2)} MB` : "No file selected"}
            </div>
          </div>
          <div>
            <div className="text-sm mb-1">Remark (optional)</div>
            <Textarea placeholder="Notes / context" rows={3} value={remark} onChange={(e)=>setRemark(e.target.value)} disabled={busy}/>
          </div>
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex items-center justify-end gap-2">
          <button className="px-4 py-2 rounded-lg text-sm border dark:border-gray-700" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={`px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 ${busy?"opacity-70":""}`}
                  onClick={doUpload} disabled={busy || !receiverId || !file}>
            {busy?"Uploading...":"Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Remarks Modal ---- */
function RemarksModal({
  open, id, onClose, onAdded
}: { open:boolean; id:string; onClose:()=>void; onAdded:()=>void; }) {
  const [items,setItems] = useState<{by:string;text:string;at:string}[]>([]);
  const [text,setText] = useState("");
  const [busy,setBusy] = useState(false);

  useEffect(()=>{ if(!open||!id) return; (async()=>{
    try {
      const r = await fetch(`/api/admin/call?op=remarks&id=${encodeURIComponent(id)}`, { credentials: "include", cache: "no-store" });
      setItems(r.ok ? await r.json() : []);
    } catch { setItems([]); }
  })(); },[open,id]);

  async function addRemark(){
    if(!text.trim()) return;
    setBusy(true);
    try{
      const r = await fetch("/api/admin/call?op=remark", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        credentials: "include",
        body: JSON.stringify({ id, text })
      });
      if(!r.ok){ const e=await r.json().catch(()=>({})); throw new Error(e.error||"Failed"); }
      setText(""); onAdded();
      const rr = await fetch(`/api/admin/call?op=remarks&id=${encodeURIComponent(id)}`, { credentials: "include" });
      setItems(rr.ok?await rr.json():[]);
    }catch(e:any){ alert(e?.message||"Failed"); }
    finally{ setBusy(false); }
  }

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl relative">
        <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" onClick={onClose}><X size={18}/></button>
        <div className="p-5 border-b dark:border-gray-700"><h3 className="text-lg font-semibold">Remarks</h3></div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            {items.length===0 && <div className="text-sm text-gray-500">No remarks yet.</div>}
            {items.map((it,i)=>(
              <div key={i} className="rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-500">{new Date(it.at).toLocaleString()}</div>
                <div className="text-sm"><span className="font-medium">{it.by}</span>: {it.text}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-2">
            <Textarea rows={3} placeholder="Add a new remark (won’t edit old ones)" value={text} onChange={(e)=>setText(e.target.value)} />
            <div className="flex justify-end">
              <button disabled={busy||!text.trim()} onClick={addRemark}
                      className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                Add Remark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Main Page (admin-only) ---- */
export default function CallPage() {
  const router = useRouter();
  const [me,setMe]=useState<Me|null>(null);
  const [rows,setRows]=useState<CallRow[]>([]);
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const [uploadOpen,setUploadOpen]=useState(false);
  const [remarksOpen,setRemarksOpen]=useState(false);
  const [loading,setLoading]=useState(true);

  const isAdmin = me?.role === "admin";
  const can = (perm: string) => !!(isAdmin && hasWithAliases(me?.permissions, perm));

  async function refresh(){
    const r = await fetch("/api/admin/call?op=list", { credentials: "include", cache: "no-store" });
    if(r.ok){ const list = await r.json(); setRows(list); }
    setSelectedIds([]);
  }

  useEffect(() => {
    (async () => {
      try {
        const mres = await fetch("/api/admin/me", { credentials: "include", cache: "no-store" });
        if (mres.status === 401) { router.replace("/admin/login"); return; }
        const payload = await mres.json();
        const m: Me = payload?.user || payload;
        if (!m || m.role !== "admin" || m.status !== "active") { router.replace("/admin"); return; }
        setMe(m);
        if (!hasWithAliases(m.permissions, "call:page_view")) { router.replace("/admin"); return; }
        await refresh();
      } finally { setLoading(false); }
    })();
  }, [router]);

  const allSelected = selectedIds.length>0 && selectedIds.length===rows.length;
  const toggleSelect=(id:string)=> setSelectedIds(p=> p.includes(id)? p.filter(x=>x!==id): [...p,id]);
  const toggleSelectAll=(checked:boolean)=> setSelectedIds(checked? rows.map(r=>r.id): []);
  const oneSelectedId = useMemo(()=> selectedIds.length===1? selectedIds[0]:"", [selectedIds]);

  function openUpload(){ if(!can("call:upload")) return; setUploadOpen(true); }
  function openRemarks(){ if(!oneSelectedId) return alert("Select one row"); setRemarksOpen(true); }
  function viewSelected(){ if(!can("call:view")||!oneSelectedId) return; window.open(`/api/admin/call?op=file&id=${oneSelectedId}&mode=view`,"_blank","noopener,noreferrer"); }
  function downloadSelected(){ if(!can("call:download")||!oneSelectedId) return; window.open(`/api/admin/call?op=file&id=${oneSelectedId}`,"_blank","noopener,noreferrer"); }
  async function deleteSelected(){
    if(!can("call:delete")||selectedIds.length===0) return;
    const sure=confirm("Remove from your table?");
    if(!sure) return;
    const r=await fetch("/api/admin/call?op=delete",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      credentials:"include",
      body:JSON.stringify({ ids: selectedIds })
    });
    if(!r.ok){ const e=await r.json().catch(()=>({})); alert(e.error||"Delete failed"); return; }
    refresh();
  }

  if(loading) return <div className="p-6 text-sm text-gray-600 dark:text-gray-400">Loading…</div>;

  return (
    <div className="p-6">
      {/* Top Buttons */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={openUpload} disabled={!can("call:upload")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
            can("call:upload")? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                              : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <Upload size={16}/> Upload
        </button>

        <button onClick={downloadSelected} disabled={!can("call:download")||selectedIds.length!==1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
            can("call:download")&&selectedIds.length===1? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                        : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <Download size={16}/> Download
        </button>

        <button onClick={viewSelected} disabled={!can("call:view")||selectedIds.length!==1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
            can("call:view")&&selectedIds.length===1? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                    : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <Eye size={16}/> View
        </button>

        <button onClick={openRemarks} disabled={!can("call:view")||selectedIds.length!==1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
            selectedIds.length===1? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                   : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <MessageSquareMore size={16}/> Remarks
        </button>

        <button onClick={deleteSelected} disabled={!can("call:delete")||selectedIds.length===0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${
            can("call:delete")&&selectedIds.length>0? "border-gray-300 text-gray-700 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                    : "opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700"}`}>
          <Trash2 size={16}/> Delete
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-sm table-auto min-w-[1000px]">
          <thead className="text-left bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-5 py-3 w-12"><input type="checkbox" onChange={(e)=>toggleSelectAll(e.target.checked)} checked={allSelected}/></th>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Sender</th>
              <th className="px-5 py-3">Receiver</th>
              <th className="px-5 py-3">File</th>
              <th className="px-5 py-3">Remark (latest)</th>
              <th className="px-5 py-3">Date / Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f)=>(
              <tr key={f.id} className="border-t dark:border-gray-700">
                <td className="px-5 py-3"><input type="checkbox" checked={selectedIds.includes(f.id)} onChange={()=>toggleSelect(f.id)}/></td>
                <td className="px-5 py-3 text-gray-900 dark:text-gray-300">{f.id.slice(-6)}</td>
                <td className="px-5 py-3 text-gray-900 dark:text-gray-300">
                  <div className="font-medium">{f.senderUsername}</div>
                  <div className="text-xs text-gray-500">{f.senderRole.toUpperCase()}</div>
                </td>
                <td className="px-5 py-3 text-gray-900 dark:text-gray-300">
                  <div className="font-medium">{f.receiverUsername}</div>
                  <div className="text-xs text-gray-500">{f.receiverRole.toUpperCase()}</div>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={()=>window.open(`/api/admin/call?op=file&id=${f.id}`,"_blank","noopener,noreferrer")}
                    className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2">
                    <FileDown size={14}/> {f.fileName}
                  </button>
                </td>
                <td className="px-5 py-3 text-gray-900 dark:text-gray-300 text-sm">{f.lastRemark || f.remark || "-"}</td>
                <td className="px-5 py-3 text-gray-900 dark:text-gray-300">
                  {new Date(f.createdAt).toLocaleDateString()}{" "}
                  <span className="text-xs text-gray-600 dark:text-gray-400">{new Date(f.createdAt).toLocaleTimeString()}</span>
                </td>
              </tr>
            ))}
            {rows.length===0 && (
              <tr><td className="px-5 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={7}>No files</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <UploadModal open={uploadOpen} me={me} onClose={()=>setUploadOpen(false)} onUploaded={refresh}/>
      <RemarksModal open={remarksOpen} id={oneSelectedId} onClose={()=>setRemarksOpen(false)} onAdded={refresh}/>
    </div>
  );
}