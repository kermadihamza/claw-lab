"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createBooking } from "@/actions/booking";
import { deposeLabel, type DeposeChoice } from "@/lib/depose";

type ServiceOption = {
  id: string;
  category: string;
  categoryLabel: string;
  name: string;
  priceMin: number;
  priceMax: number | null;
  durationMinutes: number;
  isRemovalService: boolean;
};

type Slot = { startTime: string; endTime: string; label: string };
type ModalStep = "schedule" | "details";

const DEPOSE_OPTIONS: { value: DeposeChoice; label: string }[] = [
  { value: "NONE", label: "Non, ongles nus" },
  { value: "SALON", label: "Oui, posée chez Claw lab (offerte)" },
  { value: "EXTERIEURE", label: "Oui, posée ailleurs (+15€)" },
];

const WEEKDAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MAX_MONTHS_AHEAD = 2;

function formatEUR(n: number) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);
}

function priceLabel(s: ServiceOption) {
  return s.priceMax != null
    ? `${formatEUR(s.priceMin).replace(",00", "")} - ${formatEUR(s.priceMax)}`
    : formatEUR(s.priceMin);
}

function durationLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
    2,
    "0"
  )}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function monthIndex(d: Date) {
  return d.getFullYear() * 12 + d.getMonth();
}

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-BE", { weekday: "long", day: "2-digit", month: "long" }).format(
    new Date(y, m - 1, d)
  );
}

function formatMonthLabel(monthDate: Date) {
  const label = new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric" }).format(monthDate);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Grille de cellules du mois (lundi en premier), null pour les cases vides avant le 1er. */
function buildMonthCells(monthDate: Date): (Date | null)[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  return cells;
}

/** Prochain jour ouvert à partir de `from` (inclus), selon les jours de la semaine ouverts. */
function nextOpenDate(from: Date, openWeekdays: Set<number>): Date | null {
  for (let i = 0; i < 120; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    if (openWeekdays.has(d.getDay())) return d;
  }
  return null;
}

export function BookingWizard({
  services,
  openWeekdays,
}: {
  services: ServiceOption[];
  openWeekdays: number[];
}) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfDay(new Date()));
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("schedule");
  const [depose, setDepose] = useState<DeposeChoice | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = useMemo(() => startOfDay(new Date()), []);
  const openWeekdaySet = useMemo(() => new Set(openWeekdays), [openWeekdays]);
  const maxMonthIndex = monthIndex(today) + MAX_MONTHS_AHEAD;

  const grouped = useMemo(() => {
    const byCategory = new Map<string, { label: string; items: ServiceOption[] }>();
    for (const s of services) {
      if (!byCategory.has(s.category)) byCategory.set(s.category, { label: s.categoryLabel, items: [] });
      byCategory.get(s.category)!.items.push(s);
    }
    return Array.from(byCategory.values());
  }, [services]);

  const selectedService = services.find((s) => s.id === serviceId) ?? null;
  const monthCells = useMemo(() => buildMonthCells(calendarMonth), [calendarMonth]);

  useEffect(() => {
    if (!serviceId || !date || depose === null) {
      setSlots(null);
      return;
    }
    setLoadingSlots(true);
    fetch(`/api/slots?date=${date}&serviceId=${serviceId}&depose=${depose}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .finally(() => setLoadingSlots(false));
  }, [serviceId, date, depose]);

  useEffect(() => {
    if (!modalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  /** Ferme la modale sans réservation : on revient à l'état de départ (page de prestations). */
  function closeModal() {
    setModalOpen(false);
    setModalStep("schedule");
    setServiceId(null);
    setDate(null);
    setSelectedSlot(null);
    setDepose(null);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setNotes("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !selectedSlot) return;
    setError(null);
    startTransition(async () => {
      const result = await createBooking({
        serviceId,
        date,
        startTime: selectedSlot.startTime,
        clientName,
        clientPhone,
        clientEmail,
        notes,
        depose,
      });
      if (result && !result.ok) {
        setError(result.error ?? "Une erreur est survenue");
      }
    });
  }

  return (
    <div className="mt-10 space-y-10">
      {/* Étape 1 : prestation — tout le reste (horaire, coordonnées) se passe dans la modale */}
      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Choisissez votre prestation</h2>
        <div className="mt-4 space-y-6">
          {grouped.map((g) => (
            <div key={g.label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-light/70">{g.label}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {g.items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setServiceId(s.id);
                      const next = nextOpenDate(today, openWeekdaySet);
                      setDate(next ? toISODate(next) : null);
                      setCalendarMonth(next ?? today);
                      setSelectedSlot(null);
                      setDepose(s.isRemovalService ? "NONE" : null);
                      setModalStep("schedule");
                      setModalOpen(true);
                    }}
                    className="rounded-xl border border-ink/15 px-4 py-3 text-left transition hover:border-ink/40"
                  >
                    <p className="font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-ink-light/80">
                      {durationLabel(s.durationMinutes)} · {priceLabel(s)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modale : horaire puis coordonnées */}
      {modalOpen && selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="card-frosted max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold text-ink">
                  {modalStep === "schedule" ? "Sélectionnez une date et une heure" : "Vos coordonnées"}
                </p>
                <p className="text-sm text-ink-light">{selectedService.name}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fermer"
                className="rounded-full p-1.5 text-ink-light transition hover:bg-ink/5"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z" />
                </svg>
              </button>
            </div>

            {modalStep === "schedule" ? (
              <>
                {!selectedService.isRemovalService && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-ink">
                      Avez-vous actuellement une pose sur les ongles ?
                    </p>
                    <div className="mt-2 space-y-2">
                      {DEPOSE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setDepose(opt.value);
                            setSelectedSlot(null);
                          }}
                          className={`block w-full rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition ${
                            depose === opt.value
                              ? "border-slate-600 bg-slate-600 text-white"
                              : "border-ink/15 text-ink hover:border-slate-600/50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedService.isRemovalService || depose !== null) && (
                  <>
                    {/* Navigation mensuelle */}
                    <div className="mt-5 flex items-center justify-between">
                      <button
                        type="button"
                        aria-label="Mois précédent"
                        disabled={monthIndex(calendarMonth) <= monthIndex(today)}
                        onClick={() =>
                          setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
                        }
                        className="rounded-full p-1.5 text-ink-light transition hover:bg-ink/5 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                          <path
                            fillRule="evenodd"
                            d="M12.707 15.707a1 1 0 0 1-1.414 0l-5-5a1 1 0 0 1 0-1.414l5-5a1 1 0 1 1 1.414 1.414L8.414 10l4.293 4.293a1 1 0 0 1 0 1.414Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <p className="font-display font-semibold text-ink">{formatMonthLabel(calendarMonth)}</p>
                      <button
                        type="button"
                        aria-label="Mois suivant"
                        disabled={monthIndex(calendarMonth) >= maxMonthIndex}
                        onClick={() =>
                          setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
                        }
                        className="rounded-full p-1.5 text-ink-light transition hover:bg-ink/5 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                          <path
                            fillRule="evenodd"
                            d="M7.293 4.293a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L11.586 10 7.293 5.707a1 1 0 0 1 0-1.414Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Grille du calendrier */}
                    <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
                      {WEEKDAY_LABELS.map((w) => (
                        <p key={w} className="text-xs font-medium text-ink-light/60">
                          {w}
                        </p>
                      ))}
                      {monthCells.map((cell, i) => {
                        if (!cell) return <div key={`empty-${i}`} />;
                        const iso = toISODate(cell);
                        const isPast = cell < today;
                        const isClosed = !openWeekdaySet.has(cell.getDay());
                        const disabled = isPast || isClosed;
                        const isSelected = date === iso;
                        const isToday = isSameDay(cell, today);

                        return (
                          <div key={iso} className="flex justify-center py-0.5">
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                setDate(iso);
                                setSelectedSlot(null);
                              }}
                              className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
                                disabled
                                  ? `cursor-not-allowed text-ink-light/30 ${isClosed ? "line-through" : ""}`
                                  : isSelected
                                    ? "bg-slate-600 font-semibold text-white"
                                    : "font-medium text-ink hover:bg-ink/5"
                              }`}
                            >
                              {cell.getDate()}
                              {isToday && (
                                <span
                                  className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                                    isSelected ? "bg-white" : "bg-slate-600"
                                  }`}
                                />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Créneaux du jour sélectionné */}
                    {date && (
                      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {loadingSlots && (
                          <p className="col-span-full text-sm text-ink-light/80">Chargement des créneaux...</p>
                        )}
                        {!loadingSlots && slots?.length === 0 && (
                          <p className="col-span-full text-sm text-ink-light/80">
                            Plus aucun créneau disponible ce jour-là.
                          </p>
                        )}
                        {!loadingSlots &&
                          slots?.map((slot) => (
                            <button
                              key={slot.startTime}
                              type="button"
                              onClick={() => {
                                setSelectedSlot(slot);
                                setModalStep("details");
                              }}
                              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-center text-sm font-medium text-ink transition hover:border-slate-600 hover:text-slate-600"
                            >
                              {slot.label}
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-ink/15 px-4 py-3">
                  <div>
                    <p className="font-medium capitalize text-ink">
                      {date && formatDateLabel(date)} à {selectedSlot?.label}
                    </p>
                    {depose && depose !== "NONE" && (
                      <p className="mt-1 text-xs text-ink-light">{deposeLabel(depose)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalStep("schedule")}
                    className="shrink-0 text-sm font-semibold text-slate-600 hover:underline"
                  >
                    Modifier
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <label className="block text-sm">
                    Email
                    <input
                      required
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 text-ink"
                    />
                    <span className="mt-1 block text-xs text-ink-light/70">
                      Une confirmation vous sera envoyée à cette adresse.
                    </span>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">
                      Nom complet
                      <input
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 text-ink"
                      />
                    </label>
                    <label className="block text-sm">
                      Téléphone (optionnel)
                      <input
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 text-ink"
                      />
                    </label>
                  </div>
                  <label className="block text-sm">
                    Remarques (optionnel)
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 text-ink"
                      rows={2}
                    />
                  </label>

                  {error && <p className="text-sm font-medium text-red-700">{error}</p>}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-full bg-ink px-6 py-3 font-semibold text-cream-50 transition hover:bg-ink-light disabled:opacity-60"
                  >
                    {isPending ? "Réservation en cours..." : "Confirmer la réservation"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
