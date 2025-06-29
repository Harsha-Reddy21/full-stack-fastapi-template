import { createFileRoute } from "@tanstack/react-router"
import { Container } from "@chakra-ui/react"

import NotesList from "@/components/Notes/NotesList"

export const Route = createFileRoute("/_layout/notes")({
  component: NotesPage,
})

function NotesPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <NotesList />
    </Container>
  )
} 