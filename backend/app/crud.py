import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import Item, ItemCreate, Note, NoteCreate, NoteUpdate, User, UserCreate, UserUpdate


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


# Note CRUD functions
def create_note(*, session: Session, note_in: NoteCreate, owner_id: uuid.UUID) -> Note:
    db_note = Note.model_validate(note_in, update={"owner_id": owner_id})
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return db_note


def get_note(*, session: Session, note_id: uuid.UUID) -> Note | None:
    statement = select(Note).where(Note.id == note_id)
    return session.exec(statement).first()


def get_notes(
    *, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Note]:
    statement = select(Note).where(Note.owner_id == owner_id).offset(skip).limit(limit)
    return session.exec(statement).all()


def update_note(
    *, session: Session, db_note: Note, note_in: NoteUpdate
) -> Note:
    note_data = note_in.model_dump(exclude_unset=True)
    db_note.sqlmodel_update(note_data)
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return db_note


def delete_note(*, session: Session, note_id: uuid.UUID) -> Note | None:
    note = get_note(session=session, note_id=note_id)
    if note:
        session.delete(note)
        session.commit()
    return note
