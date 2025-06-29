import React, { useState } from "react"
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  SimpleGrid,
  Spacer,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FaEdit, FaPlus, FaTrash, FaThumbtack } from "react-icons/fa"
import { useNavigate } from "@tanstack/react-router"

import { ApiError } from "@/client"
import { handleError } from "@/utils"

// Mock API client for notes - this would be replaced by the actual generated client
const NotesApi = {
  getNotes: async () => {
    // This is a mock implementation
    const storedNotes = localStorage.getItem("user_notes")
    return storedNotes ? JSON.parse(storedNotes) : { data: [], count: 0 }
  },
  createNote: async (note) => {
    // This is a mock implementation
    const storedNotes = localStorage.getItem("user_notes")
    const notes = storedNotes ? JSON.parse(storedNotes) : { data: [], count: 0 }
    const newNote = {
      ...note,
      id: `note-${Date.now()}`,
      owner_id: "current-user",
    }
    notes.data.push(newNote)
    notes.count = notes.data.length
    localStorage.setItem("user_notes", JSON.stringify(notes))
    return newNote
  },
  updateNote: async (id, note) => {
    // This is a mock implementation
    const storedNotes = localStorage.getItem("user_notes")
    const notes = storedNotes ? JSON.parse(storedNotes) : { data: [], count: 0 }
    const index = notes.data.findIndex((n) => n.id === id)
    if (index !== -1) {
      notes.data[index] = { ...notes.data[index], ...note }
      localStorage.setItem("user_notes", JSON.stringify(notes))
      return notes.data[index]
    }
    throw new Error("Note not found")
  },
  deleteNote: async (id) => {
    // This is a mock implementation
    const storedNotes = localStorage.getItem("user_notes")
    const notes = storedNotes ? JSON.parse(storedNotes) : { data: [], count: 0 }
    const index = notes.data.findIndex((n) => n.id === id)
    if (index !== -1) {
      const deletedNote = notes.data[index]
      notes.data.splice(index, 1)
      notes.count = notes.data.length
      localStorage.setItem("user_notes", JSON.stringify(notes))
      return deletedNote
    }
    throw new Error("Note not found")
  },
}

const NoteForm = ({ initialData = null, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || "")
  const [content, setContent] = useState(initialData?.content || "")
  const [isPinned, setIsPinned] = useState(initialData?.is_pinned || false)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ title, content, is_pinned: isPinned })
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Title</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
          />
        </FormControl>
        <FormControl>
          <FormLabel>Content</FormLabel>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note content"
            minH="150px"
          />
        </FormControl>
        <Flex align="center">
          <Button
            leftIcon={<FaThumbtack />}
            variant={isPinned ? "solid" : "outline"}
            onClick={() => setIsPinned(!isPinned)}
            size="sm"
          >
            {isPinned ? "Pinned" : "Pin Note"}
          </Button>
          <Spacer />
          <Button variant="ghost" mr={3} onClick={onCancel}>
            Cancel
          </Button>
          <Button colorScheme="blue" type="submit">
            Save
          </Button>
        </Flex>
      </Stack>
    </Box>
  )
}

const NoteCard = ({ note, onEdit, onDelete }) => {
  const cardBg = useColorModeValue("white", "gray.700")
  const pinnedColor = useColorModeValue("yellow.500", "yellow.300")

  return (
    <Card bg={cardBg} boxShadow="md">
      <CardHeader pb={2}>
        <Flex align="center">
          <Heading size="md" noOfLines={1}>
            {note.title}
          </Heading>
          <Spacer />
          {note.is_pinned && (
            <Box color={pinnedColor}>
              <FaThumbtack />
            </Box>
          )}
        </Flex>
      </CardHeader>
      <CardBody pt={0}>
        <Text noOfLines={4}>{note.content}</Text>
      </CardBody>
      <CardFooter pt={0}>
        <Flex width="100%">
          <Spacer />
          <IconButton
            icon={<FaEdit />}
            aria-label="Edit note"
            size="sm"
            variant="ghost"
            onClick={() => onEdit(note)}
            mr={2}
          />
          <IconButton
            icon={<FaTrash />}
            aria-label="Delete note"
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => onDelete(note.id)}
          />
        </Flex>
      </CardFooter>
    </Card>
  )
}

const NotesList = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingNote, setEditingNote] = useState(null)

  // Fetch notes
  const { data: notesData, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: NotesApi.getNotes,
  })

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (data) => NotesApi.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      toast({
        title: "Note created",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      onClose()
    },
    onError: (error) => {
      handleError(error)
    },
  })

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }) => NotesApi.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      toast({
        title: "Note updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      setEditingNote(null)
      onClose()
    },
    onError: (error) => {
      handleError(error)
    },
  })

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (id) => NotesApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      toast({
        title: "Note deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      handleError(error)
    },
  })

  const handleCreateNote = (data) => {
    createNoteMutation.mutate(data)
  }

  const handleUpdateNote = (data) => {
    updateNoteMutation.mutate({ id: editingNote.id, data })
  }

  const handleDeleteNote = (id) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(id)
    }
  }

  const handleEditClick = (note) => {
    setEditingNote(note)
    onOpen()
  }

  const handleNewNote = () => {
    setEditingNote(null)
    onOpen()
  }

  const handleFormCancel = () => {
    setEditingNote(null)
    onClose()
  }

  // Sort notes - pinned first, then by id (most recent first)
  const sortedNotes = notesData?.data
    ? [...notesData.data].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return b.id.localeCompare(a.id)
      })
    : []

  return (
    <Box>
      <Flex mb={6} align="center">
        <Heading size="lg">Notes</Heading>
        <Spacer />
        <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleNewNote}>
          New Note
        </Button>
      </Flex>

      {isOpen ? (
        <Box mb={6} p={4} borderWidth="1px" borderRadius="lg">
          <NoteForm
            initialData={editingNote}
            onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
            onCancel={handleFormCancel}
          />
        </Box>
      ) : null}

      {isLoading ? (
        <Text>Loading notes...</Text>
      ) : sortedNotes.length === 0 ? (
        <Text>No notes yet. Create your first note!</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEditClick}
              onDelete={handleDeleteNote}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  )
}

export default NotesList 