from typing import Optional, List
from pydantic import BaseModel, Field


class Nominee(BaseModel):
    """Represents an individual nominee in an award category."""
    id: str = Field(..., description="Unique slug for the nominee")
    name: str = Field(..., description="Nominee name (game title, person, or organization)")
    details: Optional[str] = Field(None, description="Studio, publisher, role, or additional credit")
    winner: bool = Field(False, description="Whether this nominee won the category")
    image_url: Optional[str] = Field(None, description="Optional image/cover URL")


class Category(BaseModel):
    """Represents an award category."""
    id: str = Field(..., description="Unique slug for the category (e.g. game-of-the-year)")
    title: str = Field(..., description="Category display title (e.g. Jogo do Ano)")
    nominees: List[Nominee] = Field(default_factory=list, description="List of nominees")
    winner_id: Optional[str] = Field(None, description="ID of the winning nominee if announced")


class EditionSummary(BaseModel):
    """Summary of a single ceremony edition (used in editions.json)."""
    year: int
    title: str
    status: str = Field(..., description="'open', 'locked', or 'concluded'")
    categories_count: int
    has_winners: bool
    url: Optional[str] = None


class Edition(BaseModel):
    """Full data of an edition including all categories and nominees."""
    year: int
    title: str
    status: str = Field("concluded", description="'open', 'locked', or 'concluded'")
    last_updated: str = Field(..., description="ISO 8601 timestamp of extraction")
    categories_count: int
    categories: List[Category] = Field(default_factory=list)
