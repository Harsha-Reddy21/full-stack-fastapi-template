import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app import crud
from app.api.deps import SessionDep, CurrentUser
from app.models import Note, NoteCreate, NotePublic, NoteUpdate, NotesPublic, User

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/", response_model=NotesPublic)
def read_notes(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve notes for the current user.
    """
    notes = crud.get_notes(
        session=session, owner_id=current_user.id, skip=skip, limit=limit
    )
    return NotesPublic(data=notes, count=len(notes))


@router.post("/", response_model=NotePublic)
def create_note(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    note_in: NoteCreate,
) -> Any:
    """
    Create new note for the current user.
    """
    note = crud.create_note(session=session, note_in=note_in, owner_id=current_user.id)
    return note


@router.get("/{note_id}", response_model=NotePublic)
def read_note(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    note_id: uuid.UUID,
) -> Any:
    """
    Get note by ID.
    """
    note = crud.get_note(session=session, note_id=note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return note


@router.put("/{note_id}", response_model=NotePublic)
def update_note(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    note_id: uuid.UUID,
    note_in: NoteUpdate,
) -> Any:
    """
    Update a note.
    """
    note = crud.get_note(session=session, note_id=note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    note = crud.update_note(session=session, db_note=note, note_in=note_in)
    return note


@router.delete("/{note_id}", response_model=NotePublic)
def delete_note(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    note_id: uuid.UUID,
) -> Any:
    """
    Delete a note.
    """
    note = crud.get_note(session=session, note_id=note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    note = crud.delete_note(session=session, note_id=note_id)
    return note 