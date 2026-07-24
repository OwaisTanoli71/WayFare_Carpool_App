import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import * as faceapi from '@vladmandic/face-api'

function LivenessCamera({ onCapture }) {
  const videoRef = useRef(null)
  const framesRef = useRef([])
  const streamRef = useRef(null)
  const trackingRef = useRef(false)
  const poseHoldFramesRef = useRef(0)
  const [instruction, setInstruction] = useState('Loading ML models...')
  const [phase, setPhase] = useState(0) // 0: init, 1: straight, 2: left, 3: right, 4: down, 5: captured
  const [modelsLoaded, setModelsLoaded] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ])
        setModelsLoaded(true)
        startCamera()
      } catch (err) {
        console.error("ML Error:", err)
        setInstruction("Failed to load face tracking models.")
      }
    }
    init()
    
    return () => {
      trackingRef.current = false
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) videoRef.current.srcObject = stream
      streamRef.current = stream
      setPhase(1)
      setInstruction("Look straight ahead...")
    } catch (err) {
      console.error("Camera error:", err)
      setInstruction("Camera access denied.")
    }
  }

  const snapFrame = () => {
    if (!videoRef.current) return null
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 480
    canvas.height = video.videoHeight || 640
    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  const finishSequence = () => {
    setPhase(5)
    setInstruction("Liveness verified!")

    const frames = framesRef.current
    if (frames.length === 4 && frames[0]) {
      const singleW = frames[0].width
      const singleH = frames[0].height
      
      const collage = document.createElement('canvas')
      collage.width = singleW * 2
      collage.height = singleH * 2
      const ctx = collage.getContext('2d')

      ctx.drawImage(frames[0], 0, 0, singleW, singleH) 
      ctx.drawImage(frames[1], singleW, 0, singleW, singleH) 
      ctx.drawImage(frames[2], 0, singleH, singleW, singleH) 
      ctx.drawImage(frames[3], singleW, singleH, singleW, singleH) 
      
      ctx.font = '24px sans-serif'
      ctx.fillStyle = 'white'
      ctx.shadowColor = 'black'
      ctx.shadowBlur = 4
      ctx.lineWidth = 2
      const drawLabel = (text, x, y) => {
        ctx.strokeText(text, x + 20, y + 40)
        ctx.fillText(text, x + 20, y + 40)
      }
      
      drawLabel("Straight", 0, 0)
      drawLabel("Left", singleW, 0)
      drawLabel("Right", 0, singleH)
      drawLabel("Down", singleW, singleH)

      const dataUrl = collage.toDataURL('image/jpeg', 0.85)
      
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      onCapture(dataUrl)
    }
  }

  const trackFace = async () => {
    if (!videoRef.current || !trackingRef.current) return

    try {
      const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
      
      if (detections) {
        const landmarks = detections.landmarks
        const nose = landmarks.getNose()[3] 
        const leftEye = landmarks.getLeftEye()[0] 
        const rightEye = landmarks.getRightEye()[3] 
        const jaw = landmarks.getJawOutline()
        const chin = jaw[8]
        const noseTop = landmarks.getNose()[0]
        
        const leftDist = Math.max(1, nose.x - leftEye.x)
        const rightDist = Math.max(1, rightEye.x - nose.x)
        const topDist = Math.max(1, nose.y - noseTop.y)
        const bottomDist = Math.max(1, chin.y - nose.y)

        const yawRatio = rightDist / leftDist
        const pitchRatio = bottomDist / topDist

        setPhase((p) => {
          let poseHit = false;

          if (p === 1) { 
             // Straight
             if (yawRatio > 0.7 && yawRatio < 1.3 && pitchRatio > 0.9 && pitchRatio < 1.8) {
               poseHit = true;
               if (poseHoldFramesRef.current >= 5) {
                 framesRef.current.push(snapFrame())
                 setInstruction("Turn head slightly to the left...")
                 poseHoldFramesRef.current = 0
                 return 2
               }
             }
          } else if (p === 2) {
             // Left
             if (yawRatio < 0.75) { 
               poseHit = true;
               if (poseHoldFramesRef.current >= 5) {
                 framesRef.current.push(snapFrame())
                 setInstruction("Now, turn slightly to the right...")
                 poseHoldFramesRef.current = 0
                 return 3
               }
             }
          } else if (p === 3) {
             // Right
             if (yawRatio > 1.35) { 
               poseHit = true;
               if (poseHoldFramesRef.current >= 5) {
                 framesRef.current.push(snapFrame())
                 setInstruction("Finally, look slightly downward...")
                 poseHoldFramesRef.current = 0
                 return 4
               }
             }
          } else if (p === 4) {
             // Down
             if (pitchRatio < 1.25) { 
               poseHit = true;
               if (poseHoldFramesRef.current >= 5) {
                 framesRef.current.push(snapFrame())
                 poseHoldFramesRef.current = 0
                 setTimeout(() => finishSequence(), 0)
                 return 5 
               }
             }
          }
          
          if (poseHit) {
             poseHoldFramesRef.current += 1
          } else {
             poseHoldFramesRef.current = 0
          }
          
          return p
        })
      } else {
        setPhase((p) => {
           if (p > 0 && p < 5) setInstruction("Please position your face in the oval clearly...")
           return p
        })
      }
    } catch (err) {
      // Error tracking face, continue loop
    }

    if (trackingRef.current) {
      setTimeout(trackFace, 100) // 10 FPS tracking is enough and saves CPU
    }
  }

  const handleVideoPlay = () => {
    if (!modelsLoaded) return
    trackingRef.current = true
    trackFace()
  }

  return (
    <div className="flex flex-col items-center mt-6 mb-2">
      <div className="relative w-56 h-72 sm:w-64 sm:h-80 rounded-[100px] overflow-hidden border-4 border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.15)] bg-ink-900 flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          onPlay={handleVideoPlay}
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
        />
            {/* Scanner line overlay */}
            <motion.div 
              animate={{ y: [-160, 160, -160] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
              className="absolute w-full h-1.5 bg-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,1)] z-10"
            />
            
            {/* Directional Arrows based on phase */}
            <AnimatePresence>
              {phase === 1 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center z-20 text-amber-400 pointer-events-none"
                >
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <svg className="w-16 h-16 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </motion.div>
                </motion.div>
              )}
              {phase === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="absolute left-6 flex items-center justify-center z-20 text-amber-400"
                >
                  <motion.div animate={{ x: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <svg className="w-10 h-10 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </motion.div>
                </motion.div>
              )}
              {phase === 3 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="absolute right-6 flex items-center justify-center z-20 text-amber-400"
                >
                  <motion.div animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <svg className="w-10 h-10 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </motion.div>
                </motion.div>
              )}
              {phase === 4 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute bottom-8 flex flex-col items-center justify-center z-20 text-amber-400"
                >
                  <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <svg className="w-10 h-10 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Optional Oval Mask to darken edges */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]" />
      </div>
      <div className="mt-6 h-12 flex items-center justify-center w-full bg-ink-800/50 rounded-xl border border-ink-700/50 px-4">
        <p className={`text-center text-sm font-semibold transition-colors duration-300 ${phase === 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {phase === 5 && <span className="mr-2">✅</span>}
          {instruction}
        </p>
      </div>
    </div>
  )
}

function FileDropzone({ label, id, onUpload }) {
  const [filePreview, setFilePreview] = useState(null)
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef(null)
  const inputId = id || `file-input-${Math.random().toString(36).substring(2, 9)}`

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setFilePreview(previewUrl)
      setFileName(file.name)
      
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const MAX = 1000
        if (width > height && width > MAX) {
          height = Math.round(height * (MAX / width))
          width = MAX
        } else if (height > MAX) {
          width = Math.round(width * (MAX / height))
          height = MAX
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const base64Url = canvas.toDataURL('image/jpeg', 0.6)
        if (onUpload) onUpload(file, previewUrl, base64Url)
      }
      img.src = previewUrl
    }
  }

  const handleRemove = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setFilePreview(null)
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (onUpload) onUpload(null, null)
  }

  return (
    <div className="mt-4">
      <span className="mb-2 block text-sm font-medium text-ink-50">{label}</span>
      <input
        type="file"
        id={inputId}
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <label
        htmlFor={inputId}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all overflow-hidden ${
          filePreview ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-ink-600 bg-ink-800/50 hover:border-amber-400/50'
        }`}
      >
        {filePreview ? (
          <div className="flex flex-col items-center w-full">
            <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 border border-emerald-500/30 group">
              <img src={filePreview} alt="Uploaded document" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-ink-900/80 hover:bg-red-500 text-white transition-colors shadow-md z-10"
                title="Remove photo"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span>✅</span> {fileName || 'Document attached'}
            </span>
          </div>
        ) : (
          <>
            <span className="text-3xl mb-2">📷</span>
            <span className="text-sm font-medium text-ink-100 mb-1">
              Tap to upload or select photo
            </span>
            <span className="text-[11px] text-ink-400">
              Supports PNG, JPG, WEBP (Max 5MB)
            </span>
          </>
        )}
      </label>
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
  const [existingStatus, setExistingStatus] = useState(null)
  
  useEffect(() => {
    async function checkExisting() {
      if (!user) return
      const { data } = await supabase.from('verifications').select('status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
      if (data && (data.status === 'pending' || data.status === 'approved')) {
        setExistingStatus(data.status)
      }
    }
    checkExisting()
  }, [user])

  const [form, setForm] = useState({
    idFront: null,
    idBack: null,
    licenseFront: null,
    licenseBack: null,
    selfie: null,
    carMake: '',
    carModel: '',
    carPlate: '',
    carPhoto: null
  })

  const step = steps[stepIndex]

  const canContinue = () => {
    if (step === 'id') return Boolean(form.idFront) && Boolean(form.idBack)
    if (step === 'license') return Boolean(form.licenseFront) && Boolean(form.licenseBack)
    if (step === 'liveness') return Boolean(form.selfie)
    if (step === 'car') return form.carMake && form.carModel && form.carPlate && Boolean(form.carPhoto)
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
          idFront: form.idFront || 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&q=80',
          idBack: form.idBack || 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&q=80',
          license: form.licenseFront || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80',
          selfie: form.selfie || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80',
          car: form.carPhoto || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=500&q=80'
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

  if (existingStatus === 'pending') {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col pt-12 items-center px-4">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verification Under Review</h2>
        <p className="text-ink-300 text-center max-w-sm mb-8">
          You have already submitted your documents. Our team is currently reviewing them. You'll be notified once approved.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    )
  }

  if (existingStatus === 'approved') {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col pt-12 items-center px-4">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Already Verified</h2>
        <p className="text-ink-300 text-center max-w-sm mb-8">
          Your account is already fully verified.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    )
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
                <FileDropzone label="Front of ID" onUpload={(file, previewUrl, base64Url) => setForm({ ...form, idFront: base64Url || previewUrl })} />
                <FileDropzone label="Back of ID" onUpload={(file, previewUrl, base64Url) => setForm({ ...form, idBack: base64Url || previewUrl })} />
              </motion.div>
            )}

            {step === 'license' && (
              <motion.div key="license" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-white">Driving License</h1>
                  <p className="mt-1 text-sm text-ink-100">Must be valid and issued in Pakistan.</p>
                </div>
                <FileDropzone label="Front of License" onUpload={(file, previewUrl, base64Url) => setForm({ ...form, licenseFront: base64Url || previewUrl })} />
                <FileDropzone label="Back of License" onUpload={(file, previewUrl, base64Url) => setForm({ ...form, licenseBack: base64Url || previewUrl })} />
              </motion.div>
            )}

            {step === 'liveness' && (
              <motion.div key="liveness" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-white">Liveness Check</h1>
                  <p className="mt-1 text-sm text-ink-100">Position your face in the frame so we can verify it's you.</p>
                </div>
                {form.selfie ? (
                  <div className="flex flex-col items-center mt-6">
                    <div className="w-full sm:w-[90%] rounded-2xl overflow-hidden border-4 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                      <img src={form.selfie} alt="4-Direction Liveness Collage" className="w-full h-auto object-cover" />
                    </div>
                    <p className="mt-3 text-xs text-ink-300 text-center">4-Direction Liveness Collage (Straight, Left, Right, Down)</p>
                    <button 
                      onClick={() => setForm({ ...form, selfie: null })}
                      className="mt-4 text-sm text-amber-400 hover:text-amber-300 font-medium border border-amber-500/30 px-4 py-2 rounded-lg bg-amber-500/10"
                    >
                      Retake Verification
                    </button>
                  </div>
                ) : (
                  <LivenessCamera onCapture={(dataUrl) => setForm({ ...form, selfie: dataUrl })} />
                )}
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

                <FileDropzone label="Upload Photo of your Car" onUpload={(file, previewUrl, base64Url) => setForm({ ...form, carPhoto: base64Url || previewUrl })} />
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
