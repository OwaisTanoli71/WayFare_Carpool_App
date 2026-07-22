import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'

const steps = ['id', 'license', 'liveness', 'car']

function FileDropzone({ label, onUpload }) {
  const [uploaded, setUploaded] = useState(false)

  return (
    <div className="mt-4">
      <label className="mb-2 block text-sm font-medium text-ink-50">{label}</label>
      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors ${
          uploaded ? 'border-beacon bg-beacon/5' : 'border-ink-600 bg-ink-800/50 hover:border-ink-500'
        }`}
        onClick={() => {
          setUploaded(true)
          if (onUpload) onUpload()
        }}
      >
        <span className="text-3xl mb-2">{uploaded ? '✅' : '📷'}</span>
        <span className="text-sm font-medium text-ink-100">
          {uploaded ? 'Uploaded successfully' : 'Tap to upload or take photo'}
        </span>
      </div>
    </div>
  )
}

export default function Verification() {
  const { user, setUser } = useApp()
  const navigate = useNavigate()
  const userRole = user?.role || localStorage.getItem('wayfare_role')
  const steps = userRole === 'rider' ? ['id', 'liveness'] : ['id', 'license', 'liveness', 'car']

  const [stepIndex, setStepIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    idFront: false,
    idBack: false,
    licenseFront: false,
    licenseBack: false,
    selfie: false,
    carMake: '',
    carModel: '',
    carPlate: '',
    carPhoto: false
  })

  const step = steps[stepIndex]

  const canContinue = () => {
    if (step === 'id') return form.idFront && form.idBack
    if (step === 'license') return form.licenseFront && form.licenseBack
    if (step === 'liveness') return form.selfie
    if (step === 'car') return form.carMake && form.carModel && form.carPlate && form.carPhoto
    return false
  }

  const next = async () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1)
    } else {
      setLoading(true)
      
      const { error } = await supabase.from('verifications').insert({
        user_id: user.id,
        car_details: { make: form.carMake, model: form.carModel, plate: form.carPlate },
        images: { 
          idFront: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&q=80',
          idBack: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&q=80',
          license: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80',
          selfie: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80',
          car: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=500&q=80'
        },
        status: 'pending'
      })

      if (error) {
        console.error("Verification error:", error)
        alert("Failed to submit. Please try again.")
        setLoading(false)
        return
      }

      await supabase.from('users').update({ verification_status: 'pending' }).eq('id', user.id)

      // Update local state to pending
      const updatedUser = { ...user, verification_status: 'pending' }
      setUser(updatedUser)
      
      // Persist car details locally for demo fallback
      localStorage.setItem('wayfare_car', `${form.carMake} ${form.carModel} (${form.carPlate})`)
      localStorage.setItem('wayfare_pending_verification', 'true')

      setLoading(false)
      navigate('/profile')
    }
  }

  return (
    <div className="min-h-full bg-ink-900">
            <div className="mx-auto max-w-xl px-6 py-10">
        <div className="mb-8 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= stepIndex ? 'bg-beacon shadow-glow' : 'bg-ink-700'}`} />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-ink-700 bg-ink-800/50 p-6 shadow-card backdrop-blur-md sm:p-8"
        >
          <AnimatePresence mode="wait">
            {step === 'id' && (
              <motion.div key="id" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-white">Upload your CNIC</h1>
                  <p className="mt-1 text-sm text-ink-100">Required for platform safety. Your ID is securely encrypted and never shared with riders.</p>
                </div>
                <FileDropzone label="Front of ID" onUpload={() => setForm({ ...form, idFront: true })} />
                <FileDropzone label="Back of ID" onUpload={() => setForm({ ...form, idBack: true })} />
              </motion.div>
            )}

            {step === 'license' && (
              <motion.div key="license" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-white">Driving License</h1>
                  <p className="mt-1 text-sm text-ink-100">Must be valid and issued in Pakistan.</p>
                </div>
                <FileDropzone label="Front of License" onUpload={() => setForm({ ...form, licenseFront: true })} />
                <FileDropzone label="Back of License" onUpload={() => setForm({ ...form, licenseBack: true })} />
              </motion.div>
            )}

            {step === 'liveness' && (
              <motion.div key="liveness" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-white">Liveness Check</h1>
                  <p className="mt-1 text-sm text-ink-100">Take a quick selfie so we can match it with your ID.</p>
                </div>
                <FileDropzone label="Take Selfie" onUpload={() => setForm({ ...form, selfie: true })} />
              </motion.div>
            )}

            {step === 'car' && (
              <motion.div key="car" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-white">Car Details</h1>
                  <p className="mt-1 text-sm text-ink-100">Add the vehicle you'll be driving.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-50">Make & Model</label>
                    <input
                      placeholder="e.g. Honda Civic 2022"
                      value={form.carMake}
                      onChange={(e) => setForm({ ...form, carMake: e.target.value })}
                      className="focus-ring w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-sm focus:border-beacon"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-50">Color</label>
                    <input
                      placeholder="e.g. White"
                      value={form.carModel}
                      onChange={(e) => setForm({ ...form, carModel: e.target.value })}
                      className="focus-ring w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-sm focus:border-beacon"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink-50">License Plate Number</label>
                    <input
                      placeholder="e.g. LEB-1234"
                      value={form.carPlate}
                      onChange={(e) => setForm({ ...form, carPlate: e.target.value })}
                      className="focus-ring w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-sm uppercase focus:border-beacon"
                    />
                  </div>
                </div>

                <FileDropzone label="Photo of your Car" onUpload={() => setForm({ ...form, carPhoto: true })} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-ink-700/50 pt-6">
            <button
              onClick={() => {
                if (stepIndex === 0) navigate('/profile')
                else setStepIndex(stepIndex - 1)
              }}
              className="focus-ring text-sm font-medium text-ink-100 hover:text-white"
            >
              Cancel
            </button>
            <Button variant="primary" onClick={next} disabled={!canContinue() || loading} className="px-8 py-2.5">
              {loading ? 'Submitting...' : stepIndex === steps.length - 1 ? 'Submit Verification' : 'Continue'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
