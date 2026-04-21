"use client";

import { useState, useEffect, useCallback } from "react";

const KERNEL_URL = process.env.NEXT_PUBLIC_KERNEL_URL ?? "http://localhost:3001";

// ── Design tokens (match PlaygroundClient) ────────────────────────────────────
const BORDER  = "#1a2840";
const BORDER2 = "#243352";
const TEXT    = "#f1f5f9";
const TEXT2   = "#94a3b8";
const TEXT3   = "#64748b";
const ERR     = "#f87171";
const OK      = "#34d399";
const ACCENT  = "#10b981";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Bed {
  id:         string;
  ward:       string;
  status:     "available" | "occupied";
  patient_id: string | null;
}

// ── Shared state hook ─────────────────────────────────────────────────────────
export function useBeds() {
  const [beds, setBeds]       = useState<Bed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [teamScope, setTeamScope] = useState<{ team: string; ward: string }[]>([]);
  

  const fetchBeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${KERNEL_URL}/admin/icu/beds`);
      const data = await res.json();
      if (data.ok) setBeds(data.beds);
      else setError(data.error || "Failed to load beds");
    } catch {
      setError("Cannot reach server");
    } finally {
      setLoading(false);
    }
  }, []);

const fetchTeamScope = useCallback(async () => {
  try {
    const res  = await fetch(`${KERNEL_URL}/admin/icu/team-scope`);
    const data = await res.json();
    if (data.ok) setTeamScope(data.teams);
  } catch {}
}, []);

useEffect(() => { 
  fetchBeds(); 
  fetchTeamScope(); 
}, [fetchBeds, fetchTeamScope]);

  const discharge = useCallback(async (bedId: string, patientId: string | null) => {
    try {
      const res  = await fetch(`${KERNEL_URL}/execute/discharge_patient`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bed_id: bedId, patient_id: patientId }),
      });
      const data = await res.json();
      if (data.ok) await fetchBeds();
      else setError(data.error || "Discharge failed");
    } catch {
      setError("Cannot reach server");
    }
  }, [fetchBeds]);

  const addBed = useCallback(async (id: string, ward: string) => {
    try {
      const res  = await fetch(`${KERNEL_URL}/admin/icu/beds`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, ward }),
      });
      const data = await res.json();
      if (data.ok) await fetchBeds();
      else setError(data.error || "Add bed failed");
    } catch {
      setError("Cannot reach server");
    }
  }, [fetchBeds]);


  return { beds, loading, error, fetchBeds, discharge, addBed, teamScope };
}

// ── LEFT PANEL: Compact bed status overview ───────────────────────────────────
export function BedManagerPanel({
  beds, loading, error, fetchBeds, discharge, teamScope,
}: ReturnType<typeof useBeds>) {

  const wards   = [...new Set(beds.map(b => b.ward))].sort();
  const total   = beds.length;
  const avail   = beds.filter(b => b.status === "available").length;
  const occupied = beds.filter(b => b.status === "occupied").length;

  return (
    <div style={{ padding: "20px", borderBottom: `1px solid ${BORDER}` }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "1.5px", margin: 0 }}>
          Bed Status
        </p>
        <button
          onClick={fetchBeds}
          disabled={loading}
          style={{
            background: "transparent",
            border: `1px solid ${BORDER2}`,
            borderRadius: "6px",
            padding: "2px 8px",
            fontSize: "10px",
            color: TEXT3,
            cursor: "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "..." : "↻ Refresh"}
        </button>
      </div>

      {/* Summary pills */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <div style={{ flex: 1, background: "#10b98115", border: `1px solid #10b98130`, borderRadius: "8px", padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: OK, fontFamily: "monospace" }}>{avail}</div>
          <div style={{ fontSize: "9px", color: TEXT3, textTransform: "uppercase", letterSpacing: "0.8px", marginTop: "2px" }}>Available</div>
        </div>
        <div style={{ flex: 1, background: "#ef444415", border: `1px solid #ef444430`, borderRadius: "8px", padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: ERR, fontFamily: "monospace" }}>{occupied}</div>
          <div style={{ fontSize: "9px", color: TEXT3, textTransform: "uppercase", letterSpacing: "0.8px", marginTop: "2px" }}>Occupied</div>
        </div>
        <div style={{ flex: 1, background: "#ffffff08", border: `1px solid ${BORDER2}`, borderRadius: "8px", padding: "8px 10px", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: TEXT2, fontFamily: "monospace" }}>{total}</div>
          <div style={{ fontSize: "9px", color: TEXT3, textTransform: "uppercase", letterSpacing: "0.8px", marginTop: "2px" }}>Total</div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#ef444415", border: `1px solid #ef444430`, borderRadius: "8px", padding: "8px 10px", fontSize: "11px", color: ERR, marginBottom: "8px" }}>
          {error}
        </div>
      )}

      {/* Beds by ward */}
      {loading && beds.length === 0 ? (
        <div style={{ fontSize: "12px", color: TEXT3, textAlign: "center", padding: "12px 0" }}>Loading beds…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {wards.map(ward => {
            const wardBeds = beds.filter(b => b.ward === ward);
            return (
              <div key={ward}>
                <p style={{ fontSize: "9px", fontWeight: 700, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>
                  {ward}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {wardBeds.map(bed => (
                    <div
                      key={bed.id}
                      title={bed.status === "occupied" ? `Patient: ${bed.patient_id}` : "Available"}
                      style={{
                        padding: "3px 7px",
                        borderRadius: "5px",
                        fontSize: "10px",
                        fontFamily: "monospace",
                        fontWeight: 600,
                        background: bed.status === "available" ? "#10b98118" : "#ef444418",
                        border: `1px solid ${bed.status === "available" ? "#10b98140" : "#ef444440"}`,
                        color: bed.status === "available" ? OK : ERR,
                        cursor: bed.status === "occupied" ? "pointer" : "default",
                      }}
                      onClick={() => bed.status === "occupied" && discharge(bed.id, bed.patient_id)}
                    >
                      {bed.id}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: "10px", color: TEXT3, marginTop: "10px" }}>
        Click an occupied bed to discharge patient
      </p>
      {/* ── Team Permissions ─────────────────────────────────── */}
      {teamScope.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
            Team Permissions
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
           {[...new Set((teamScope ?? []).map(t => t.team))].map(team => {
            const teamWards = (teamScope ?? []).filter(t => t.team === team).map(t => t.ward);
              return (
                <div key={team} style={{ background: "#ffffff06", border: `1px solid ${BORDER}`, borderRadius: 7, padding: "6px 10px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: TEXT2, marginBottom: 4 }}>{team}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                   {teamWards.map(ward => (
  <span key={ward} style={{
    fontSize: 9,
    padding: "2px 6px",
    borderRadius: 4,
    background: "#10b98115",
    border: "1px solid #10b98130",
    color: OK,
    fontFamily: "monospace",
  }}>
    {ward}
  </span>
))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── RIGHT PANEL TAB: Full bed manager with discharge + add bed ────────────────
export function BedManagerTab({
  beds, loading, error, fetchBeds, discharge, addBed,
}: ReturnType<typeof useBeds>) {

  const [newBedId, setNewBedId]     = useState("");
  const [newBedWard, setNewBedWard] = useState("ICU");
  const [adding, setAdding]         = useState(false);
  const [addError, setAddError]     = useState<string | null>(null);
  const [discharging, setDischarging] = useState<string | null>(null);

  const WARDS = ["ICU", "HDU", "CCU", "NICU", "Surgical ICU"];

  const handleDischarge = async (bed: Bed) => {
    setDischarging(bed.id);
    await discharge(bed.id, bed.patient_id);
    setDischarging(null);
  };

  const handleAdd = async () => {
    if (!newBedId.trim()) { setAddError("Bed ID is required"); return; }
    setAdding(true);
    setAddError(null);
    await addBed(newBedId.trim().toUpperCase(), newBedWard);
    setNewBedId("");
    setAdding(false);
  };

  const wards = [...new Set(beds.map(b => b.ward))].sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
          Bed Manager
        </p>
        <button
          onClick={fetchBeds}
          disabled={loading}
          style={{
            background: "transparent",
            border: `1px solid ${BORDER2}`,
            borderRadius: "6px",
            padding: "3px 10px",
            fontSize: "10px",
            color: TEXT3,
            cursor: "pointer",
          }}
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#ef444415", border: `1px solid #ef444430`, borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: ERR }}>
          {error}
        </div>
      )}

      {/* Beds by ward */}
      {wards.length === 0 && !loading && (
        <div style={{ background: "#08111e", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: TEXT3, margin: 0 }}>No beds found. Add one below.</p>
        </div>
      )}

      {wards.map(ward => {
        const wardBeds = beds.filter(b => b.ward === ward);
        const wardAvail = wardBeds.filter(b => b.status === "available").length;
        return (
          <div key={ward} style={{ background: "#08111e", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
            {/* Ward header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#060c18", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: TEXT2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{ward}</span>
              <span style={{ fontSize: "10px", color: wardAvail > 0 ? OK : ERR, fontFamily: "monospace" }}>
                {wardAvail}/{wardBeds.length} available
              </span>
            </div>

            {/* Bed rows */}
            <div style={{ padding: "8px 4px" }}>
              {wardBeds.map(bed => (
                <div
                  key={bed.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "7px 10px",
                    borderRadius: "7px",
                    margin: "2px 4px",
                    background: bed.status === "available" ? "#10b98108" : "#ef444408",
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                    background: bed.status === "available" ? OK : ERR,
                    boxShadow: `0 0 6px ${bed.status === "available" ? OK : ERR}80`,
                  }} />

                  {/* Bed ID */}
                  <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: TEXT, flex: 1 }}>
                    {bed.id}
                  </span>

                  {/* Status / patient */}
                  {bed.status === "occupied" && bed.patient_id ? (
                    <span style={{ fontSize: "10px", color: TEXT3, fontFamily: "monospace" }}>
                      {bed.patient_id}
                    </span>
                  ) : (
                    <span style={{ fontSize: "10px", color: OK }}>free</span>
                  )}

                  {/* Discharge button */}
                  {bed.status === "occupied" && (
                    <button
                      onClick={() => handleDischarge(bed)}
                      disabled={discharging === bed.id}
                      style={{
                        background: "#ef444420",
                        border: `1px solid #ef444440`,
                        borderRadius: "5px",
                        padding: "2px 8px",
                        fontSize: "10px",
                        color: ERR,
                        cursor: "pointer",
                        flexShrink: 0,
                        opacity: discharging === bed.id ? 0.5 : 1,
                      }}
                    >
                      {discharging === bed.id ? "…" : "Discharge"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add bed form */}
      <div style={{ background: "#08111e", border: `1px solid ${BORDER2}`, borderRadius: "10px", padding: "14px" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
          Add New Bed
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            value={newBedId}
            onChange={e => setNewBedId(e.target.value)}
            placeholder="Bed ID (e.g. ICU-6)"
            style={{
              background: "#060c18",
              border: `1px solid ${BORDER2}`,
              borderRadius: "7px",
              padding: "7px 10px",
              fontSize: "12px",
              color: TEXT,
              fontFamily: "monospace",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <select
            value={newBedWard}
            onChange={e => setNewBedWard(e.target.value)}
            style={{
              background: "#060c18",
              border: `1px solid ${BORDER2}`,
              borderRadius: "7px",
              padding: "7px 10px",
              fontSize: "12px",
              color: TEXT,
              outline: "none",
              width: "100%",
            }}
          >
            {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>

          {addError && (
            <p style={{ fontSize: "11px", color: ERR, margin: 0 }}>{addError}</p>
          )}

          <button
            onClick={handleAdd}
            disabled={adding}
            style={{
              background: `linear-gradient(135deg, #047857, #059669)`,
              border: "none",
              borderRadius: "7px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              opacity: adding ? 0.6 : 1,
              boxShadow: "0 2px 10px #05966940",
            }}
          >
            {adding ? "Adding…" : "+ Add Bed"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "#060d1a", border: `1px solid ${BORDER}`, borderRadius: "8px" }}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L2 3.5v4C2 10.5 4.5 13 7 14c2.5-1 5-3.5 5-6.5v-4L7 1z" stroke={ACCENT} strokeWidth="1.2" fill="none"/>
        </svg>
        <span style={{ fontSize: "10px", color: TEXT3 }}>
          Discharge frees the bed immediately · Changes persist to SQLite
        </span>
      </div>
    </div>
  );
}