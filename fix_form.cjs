const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

// Fix the opening tag
code = code.replace(/<AnimatePresence mode="wait">\s*step === 1 \? \(/, '<AnimatePresence mode="wait">\n          {step === 1 ? (');

// Add step 2
const step2 = `
            ) : (
              <motion.form
                key="attendee-step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleAttendeeSubmit}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-lg font-bold font-display uppercase text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <span className="p-1 rounded bg-pink-500/10 text-pink-400">2</span> Interests & Extras
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Interests</label>
                      <select multiple onChange={(e) => setSelectedInterests(Array.from(e.target.selectedOptions, option => option.value))} className="w-full bg-black/40 border border-white/10 text-white rounded p-2">
                        <option value="gaming">Gaming</option>
                        <option value="car_meet">Car Meet</option>
                        <option value="live_music">Live Music</option>
                      </select>
                    </div>
                    {selectedInterests.includes('car_meet') && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Car Make</label>
                          <input type="text" value={carMake} onChange={(e) => setCarMake(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded p-2" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Car Model</label>
                          <input type="text" value={carModel} onChange={(e) => setCarModel(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded p-2" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Car Year</label>
                          <input type="text" value={carYear} onChange={(e) => setCarYear(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded p-2" />
                        </div>
                      </>
                    )}
                    {selectedInterests.includes('gaming') && (
                      <div>
                        <label className="block text-xs font-semibold uppercase text-gray-400 mb-1.5">Favorite Games</label>
                        <input type="text" value={gamingGames} onChange={(e) => setGamingGames(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded p-2" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-xl bg-white/5 text-gray-300 w-full sm:w-auto">BACK</button>
                  <button type="submit" disabled={submitting} className="px-10 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white w-full sm:w-auto">
                    {submitting ? 'SUBMITTING...' : 'COMPLETE REGISTRATION'}
                  </button>
                </div>
              </motion.form>
            )}
`;

code = code.replace(/<\/motion\.div>\s*\}\)\s*<\/AnimatePresence>/, '</motion.div>\n' + step2 + '\n        </AnimatePresence>');
// Wait, my regex might fail. Let's just write to end.
code = code.replace(/<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/, '</motion.div>' + step2 + '        </AnimatePresence>');
// Let's just do it with split and join.
const parts = code.split(/<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>/);
if (parts.length === 2) {
  code = parts[0] + '</motion.div>' + step2 + '        </AnimatePresence>' + parts[1];
} else {
  // Try another replacement
  const p2 = code.split(/<\/motion\.div>\s*<\/AnimatePresence>/);
  if (p2.length === 2) {
    code = p2[0] + '</motion.div>' + step2 + '        </AnimatePresence>' + p2[1];
  } else {
      const p3 = code.split(/<\/motion\.div>\s*\n\s*\n\s*\)\s*\}\s*<\/AnimatePresence>/);
      // Let's just match the end
  }
}
fs.writeFileSync('src/components/RegistrationForm.tsx', code);
