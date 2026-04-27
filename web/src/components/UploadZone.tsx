import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props { onFile: (f: File) => void; loading: boolean }

export default function UploadZone({ onFile, loading }: Props) {
  const onDrop = useCallback((files: File[]) => { if (files[0]) onFile(files[0]) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1, disabled: loading,
  })

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
      loading ? 'opacity-50 cursor-not-allowed border-gray-300'
      : isDragActive ? 'border-brand-500 bg-brand-50'
      : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
    }`}>
      <input {...getInputProps()} />
      <div className="text-4xl mb-3">{loading ? '⏳' : '📸'}</div>
      <p className="text-sm text-gray-500">
        {loading ? 'Analysing your food…'
          : isDragActive ? 'Drop the photo here'
          : 'Drag a food photo here, or click to select'}
      </p>
      <p className="text-xs text-gray-400 mt-1">JPG or PNG</p>
    </div>
  )
}
