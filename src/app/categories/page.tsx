'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag, Check, X } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import type { Category } from '@/types'
import { MOCK_CATEGORIES } from '@/lib/mock-data'

const PRESET_COLORS = [
  '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444',
  '#06B6D4', '#EC4899', '#F97316', '#6B7280', '#14B8A6',
  '#EAB308', '#A855F7', '#84CC16', '#0EA5E9', '#78716C',
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#F59E0B')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const { toast } = useToast()

  const handleAdd = () => {
    if (!newName.trim()) return
    const cat: Category = {
      id: `cat-${Date.now()}`,
      user_id: 'demo',
      name: newName.trim(),
      color: newColor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setCategories(prev => [...prev, cat])
    setNewName('')
    toast({ title: 'Categoria criada!', variant: 'success' })
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color || '#F59E0B')
  }

  const saveEdit = () => {
    setCategories(prev => prev.map(c =>
      c.id === editingId ? { ...c, name: editName, color: editColor } : c
    ))
    setEditingId(null)
    toast({ title: 'Categoria atualizada', variant: 'success' })
  }

  const handleDelete = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id))
    toast({ title: 'Categoria excluída', variant: 'success' })
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-gold-400" />
            Categorias
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{categories.length} categorias</p>
        </div>

        {/* Add new */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Nova Categoria</p>
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      outline: newColor === color ? `2px solid ${color}` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
              <Input
                placeholder="Nome da categoria"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="flex-1"
              />
              <Button onClick={handleAdd} className="gap-2" disabled={!newName.trim()}>
                <Plus className="w-4 h-4" />
                Criar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="space-y-2">
          {categories.map(cat => (
            <Card key={cat.id} className="group">
              <CardContent className="p-3">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                          style={{
                            backgroundColor: color,
                            outline: editColor === color ? `2px solid ${color}` : 'none',
                            outlineOffset: '2px',
                          }}
                        />
                      ))}
                    </div>
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button size="icon" className="h-8 w-8" onClick={saveEdit}>
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(cat)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
