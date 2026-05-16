
const clinics = [
  {
    name: 'Clinique Dentaire Medina',
    address: 'Rue 23, Marrakech',
    distance: '1.2 km',
    open: '08:00 – 18:00',
    note: 'Radiologie et soins urgents',
  },
  {
    name: 'Centre Dentaire Atlas',
    address: 'Avenue Hassan II, Casablanca',
    distance: '2.8 km',
    open: '09:00 – 19:00',
    note: 'Spécialistes implantologie',
  },
  {
    name: 'Cabinet Dentaire Oasis',
    address: 'Bvd Al Qods, Rabat',
    distance: '3.4 km',
    open: '08:30 – 17:30',
    note: 'Urgence et prothèse',
  },
];

export default function NearbyMap() {
  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Nearby care options</h3>
        <p className="mt-2 text-sm text-slate-600">Locations are shown as a preview. Use your local maps app to confirm exact availability and book an appointment.</p>
      </div>
      
      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Suggested clinics</h4>
          <div className="mt-4 space-y-4">
            {clinics.map((clinic) => (
              <div key={clinic.name} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h5 className="font-semibold text-slate-900">{clinic.name}</h5>
                    <p className="text-sm text-slate-500">{clinic.address}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{clinic.distance}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>{clinic.open}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{clinic.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
            <p className="mb-3 font-semibold text-slate-900">Map view coming soon</p>
            <p>Once the maps API is enabled, this panel will show a live location map and route guidance to the nearest clinic.</p>
          </div>
          <div className="mt-6 grid gap-3 rounded-3xl border border-slate-100 bg-slate-950 p-4 text-white">
            <div className="rounded-3xl bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Priority note</p>
              <p className="mt-2 text-sm leading-6">Book a consultation within 48 hours if any urgent findings include abscess, root canal needs, or advanced decay.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
