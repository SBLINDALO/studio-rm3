"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Paperclip, X, Upload, Link as LinkIcon, FileText, Image as ImageIcon } from "lucide-react"
import type { StudyDoc, SubjectKey } from "@/lib/planner/types"
import { C } from "@/lib/planner/data"

interface Props {
  sessionKey: string
  sub: SubjectKey
  doc?: StudyDoc
  onAttach: (key: string, doc: StudyDoc) => void
  onRemove: (key: string) => void
}

export function StudyDocViewer({ sessionKey, sub, doc, onAttach, onRemove }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("File troppo grande. Massimo 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const type = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "file"
      const newDoc: StudyDoc = {
        url: dataUrl,
        dataUrl,
        name: file.name,
        type,
        size: file.size,
        addedAt: Date.now(),
      }
      onAttach(sessionKey, newDoc)
      setIsOpen(false)
    }
    reader.readAsDataURL(file)
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    const newDoc: StudyDoc = {
      url: urlInput.trim(),
      name: urlInput.trim(),
      type: "url",
      addedAt: Date.now(),
    }
    onAttach(sessionKey, newDoc)
    setUrlInput("")
    setIsOpen(false)
  }

  const remove = () => {
    onRemove(sessionKey)
  }

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const openFileDialog = (e: React.MouseEvent) => {
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUrlSubmit()
    }
  }

  return (
    <div className="ml-8 mt-2">
      <button
        onClick={toggleOpen}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-stone-100"
        style={{ color: C[sub].text }}
      >
        <Paperclip size={12} strokeWidth={2} />
        <span>Apri modalità studio</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden rounded-lg border border-stone-200 bg-white p-3 shadow-sm"
          >
            {!doc ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Carica file (PDF o immagine)
                  </label>
                  <button
                    onClick={openFileDialog}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                  >
                    <Upload size={14} strokeWidth={2} />
                    <span>Seleziona file</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      O inserisci URL
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={handleUrlKeyDown}
                      placeholder="https://..."
                      className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                    className="mt-5 rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {doc.type === "pdf" && <FileText size={14} strokeWidth={2} />}
                    {doc.type === "image" && <ImageIcon size={14} strokeWidth={2} />}
                    {doc.type === "url" && <LinkIcon size={14} strokeWidth={2} />}
                    <span className="text-sm font-medium text-stone-700">{doc.name}</span>
                  </div>
                  <button
                    onClick={remove}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>

                {doc.type === "pdf" && doc.dataUrl && (
                  <iframe
                    src={doc.dataUrl}
                    className="h-[60vh] w-full rounded-lg border border-stone-200"
                    title={doc.name}
                  />
                )}
                {doc.type === "image" && doc.dataUrl && (
                  <img
                    src={doc.dataUrl}
                    alt={doc.name}
                    className="max-h-[60vh] w-full rounded-lg border border-stone-200 object-contain"
                  />
                )}
                {doc.type === "url" && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-stone-200 bg-stone-50 p-4 text-center text-stone-700 hover:bg-stone-100"
                  >
                    <LinkIcon size={24} className="mx-auto mb-2" />
                    <span className="text-sm font-medium">Apri link esterno</span>
                    <br />
                    <span className="text-xs text-stone-500 truncate">{doc.url}</span>
                  </a>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}