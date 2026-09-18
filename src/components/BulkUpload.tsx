import { useState } from 'react'
import Papa from 'papaparse'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface ParsedRow {
  name: string
  category: string
  price_per_kg: number
  stock_kg: number
  _error?: string
}

const SAMPLE_CSV = `name,category,price_per_kg,stock_kg
Seer fish,Sea fish,650,10
Rohu,Freshwater,220,15
Prawns,Shellfish,480,8
`

export default function BulkUpload() {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [resultMsg, setResultMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleFile(file: File) {
    setFileName(file.name)
    setResultMsg(null)
    setErrorMsg(null)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: ParsedRow[] = results.data.map((r) => {
          const name = (r.name || '').trim()
          const category = (r.category || '').trim()
          const price_per_kg = Number(r.price_per_kg)
          const stock_kg = Number(r.stock_kg)

          let _error: string | undefined
          if (!name) _error = 'Missing name'
          else if (!category) _error = 'Missing category'
          else if (Number.isNaN(price_per_kg) || price_per_kg <= 0) _error = 'Invalid price'
          else if (Number.isNaN(stock_kg) || stock_kg < 0) _error = 'Invalid stock'

          return { name, category, price_per_kg, stock_kg, _error }
        })
        setRows(parsed)
      },
      error: (err) => {
        setErrorMsg(`Could not read file: ${err.message}`)
      },
    })
  }

  const validRows = rows.filter((r) => !r._error)
  const invalidRows = rows.filter((r) => r._error)

  async function handleUpload() {
    if (validRows.length === 0) return
    setUploading(true)
    setErrorMsg(null)
    setResultMsg(null)

    try {
      const payload = validRows.map((r) => ({
        name: r.name,
        category: r.category,
        price_per_kg: r.price_per_kg,
        stock_kg: r.stock_kg,
        available: true,
        photo_url: null,
      }))
      const { error } = await supabase.from('products').insert(payload)
      if (error) throw error

      setResultMsg(`Added ${validRows.length} item${validRows.length > 1 ? 's' : ''}. Add photos individually from "Today's catch" once they're in.`)
      setRows([])
      setFileName(null)
      queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Bulk upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-stock.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="border border-tide-900/10 bg-white/60 p-4">
        <p className="text-sm text-tide-600 mb-3">
          Upload a CSV with columns: <code className="text-xs bg-tide-900/5 px-1">name</code>,{' '}
          <code className="text-xs bg-tide-900/5 px-1">category</code>,{' '}
          <code className="text-xs bg-tide-900/5 px-1">price_per_kg</code>,{' '}
          <code className="text-xs bg-tide-900/5 px-1">stock_kg</code>. Photos aren't included in
          bulk upload — add them individually afterwards from "Today's catch".
        </p>
        <button
          onClick={downloadSample}
          className="text-sm text-tide-900 underline underline-offset-4 mb-4"
        >
          Download sample CSV
        </button>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
          className="text-sm block"
        />
      </div>

      {errorMsg && <p className="text-red-700 text-sm">{errorMsg}</p>}
      {resultMsg && <p className="text-tide-900 text-sm">{resultMsg}</p>}

      {rows.length > 0 && (
        <div className="border border-tide-900/10 bg-white/60 p-4">
          <p className="text-sm mb-3">
            {fileName} — {validRows.length} ready to add
            {invalidRows.length > 0 && `, ${invalidRows.length} with errors (won't be added)`}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-tide-400 border-b border-tide-900/10">
                  <th className="py-1.5 pr-3">Name</th>
                  <th className="py-1.5 pr-3">Category</th>
                  <th className="py-1.5 pr-3">Price/kg</th>
                  <th className="py-1.5 pr-3">Stock (kg)</th>
                  <th className="py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-tide-900/5">
                    <td className="py-1.5 pr-3">{r.name || '—'}</td>
                    <td className="py-1.5 pr-3">{r.category || '—'}</td>
                    <td className="py-1.5 pr-3">{r.price_per_kg || '—'}</td>
                    <td className="py-1.5 pr-3">{r.stock_kg ?? '—'}</td>
                    <td className="py-1.5">
                      {r._error ? (
                        <span className="text-red-700">{r._error}</span>
                      ) : (
                        <span className="text-tide-600">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || validRows.length === 0}
            className="mt-4 bg-tide-900 text-paper text-sm px-4 py-2 hover:bg-tide-800 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Adding…' : `Add ${validRows.length} item${validRows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
