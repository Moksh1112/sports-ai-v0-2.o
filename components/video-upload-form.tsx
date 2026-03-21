'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface UploadFormProps {
  onSuccess?: (videoId: string) => void
}

const DRILL_TYPES = [
  { value: 'sprint', label: 'Sprint' },
  { value: 'agility', label: 'Agility Drill' },
  { value: 'jump', label: 'Jump Test' },
  { value: 'balance', label: 'Balance Test' },
  { value: 'coordination', label: 'Coordination Drill' },
]

export function VideoUploadForm({ onSuccess }: UploadFormProps) {
  const { token } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [drillType, setDrillType] = useState('sprint')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'].includes(file.type)) {
        setError('Please select a valid video file (mp4, mov, avi, mkv)')
        return
      }
      if (file.size > 500 * 1024 * 1024) {
        setError('File size must be less than 500MB')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const getDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve(Math.floor(video.duration))
      }
      
      video.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(0)
      }
      
      video.src = url
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile || !title.trim()) {
      setError('Please select a video and enter a title')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get video duration
      const duration = await getDuration(selectedFile)

      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('drill_type', drillType)
      formData.append('duration_seconds', duration.toString())

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      setUploadProgress(100)
      setSelectedFile(null)
      setTitle('')
      setDescription('')
      setDrillType('sprint')
      setUploadProgress(0)
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onSuccess?.(data.video_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border border-border bg-card">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">Upload Video</h2>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Video File
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-8 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50"
              >
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">
                    {selectedFile ? selectedFile.name : 'Click to select video or drag & drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">MP4, MOV, AVI, MKV up to 500MB</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title
            </label>
            <Input
              type="text"
              placeholder="e.g., Sprint Test 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (Optional)
            </label>
            <textarea
              placeholder="Add any notes about this video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground disabled:opacity-50"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Drill Type
            </label>
            <select
              value={drillType}
              onChange={(e) => setDrillType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground disabled:opacity-50"
            >
              {DRILL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !selectedFile}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </form>
      </div>
    </Card>
  )
}
