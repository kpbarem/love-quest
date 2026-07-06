import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./DigitalScrapbook.css";
import {
    createBook,
    createPage,
    getBooks,
    getPages,
    updateBook,
    updatePage,
    uploadScrapbookFile,
    type ScrapbookBook,
    type ScrapbookPage,
    type ScrapbookElement,
} from "../lib/scrapbook";

type DigitalScrapbookProps = {
    onBack: () => void;
};

export default function DigitalScrapbook({ onBack }: DigitalScrapbookProps) {
    const [books, setBooks] = useState<ScrapbookBook[]>([]);
    const [selectedBookId, setSelectedBookId] = useState<string>("");
    const [pages, setPages] = useState<ScrapbookPage[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [newBookTitle, setNewBookTitle] = useState("Our New Book");
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(true);

    const selectedBook = books.find((book) => book.id === selectedBookId);
    const page = pages[currentPage];

    async function loadBooks() {
        setLoading(true);
        const loadedBooks = await getBooks();
        setBooks(loadedBooks);

        if (loadedBooks.length > 0 && !selectedBookId) {
            setSelectedBookId(loadedBooks[0].id);
        }

        setLoading(false);
    }

    async function loadPages(bookId: string) {
        const loadedPages = await getPages(bookId);
        setPages(loadedPages);
        setCurrentPage(0);
    }

    async function handleCreateBook() {
        const title = newBookTitle.trim() || "Untitled Book";
        const bookId = await createBook(title);

        const loadedBooks = await getBooks();
        setBooks(loadedBooks);
        setSelectedBookId(bookId);
        setNewBookTitle("Our New Book");
    }

    async function handleSaveBookTitle(title: string) {
        if (!selectedBookId) return;

        updateBook(selectedBookId, { title });

        setBooks((currentBooks) =>
            currentBooks.map((book) =>
                book.id === selectedBookId ? { ...book, title } : book
            )
        );
    }

    async function handleAddPage() {
        if (!selectedBookId) return;

        await createPage(selectedBookId, pages.length + 1);
        await loadPages(selectedBookId);
        setCurrentPage(pages.length);
    }

    async function handleSavePage() {
        if (!selectedBookId || !page) return;

        await updatePage(selectedBookId, page.id, {
            title: page.title,
            elements: page.elements,
        });

        await loadPages(selectedBookId);
    }

    function updateCurrentPage(updates: Partial<ScrapbookPage>) {
        setPages((currentPages) =>
            currentPages.map((p, index) =>
                index === currentPage ? { ...p, ...updates } : p
            )
        );
    }

    async function handleUploadFile(file: File, type: "image" | "video" | "music") {
        if (!selectedBookId || !page) return;

        const url = await uploadScrapbookFile(selectedBookId, page.id, file);

        const newElement: ScrapbookElement = {
            id: crypto.randomUUID(),
            type,
            content: url,
            order: page.elements.length,
        };

        updateCurrentPage({
            elements: [...(page.elements ?? []), newElement],
        });
    }

    function handleAddTextElement() {
        if (!page) return;

        const newElement: ScrapbookElement = {
            id: crypto.randomUUID(),
            type: "text",
            content: "",
            order: page.elements.length,
        };

        updateCurrentPage({
            elements: [...(page.elements ?? []), newElement],
        });
    }

    //updates an element in the scrapbook
    function updateElement(elementId: string, updates: Partial<ScrapbookElement>) {
        if (!page) return;

        updateCurrentPage({
            elements: page.elements.map((element) =>
                element.id === elementId ? { ...element, ...updates } : element
            ),
        });
    }

    //deletes an element from the current page of the scrapbook
    function deleteElement(elementId: string) {
        if (!page) return;

        updateCurrentPage({
            elements: page.elements
                .filter((element) => element.id !== elementId)
                .map((element, index) => ({ ...element, order: index })),
        });
    }

    //move an element within the current page of the scrapbook
    function moveElement(elementId: string, direction: -1 | 1) {
        if (!page) return;

        const sorted = [...page.elements].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((element) => element.id === elementId);
        const nextIndex = index + direction;

        if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) return;

        const [moved] = sorted.splice(index, 1);
        sorted.splice(nextIndex, 0, moved);

        updateCurrentPage({
            elements: sorted.map((element, newIndex) => ({
                ...element,
                order: newIndex,
            })),
        });
    }

    useEffect(() => {
        loadBooks();
    }, []);

    useEffect(() => {
        if (selectedBookId) {
            loadPages(selectedBookId);
        }
    }, [selectedBookId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-8 font-mono">
                Loading scrapbook...
            </div>
        );
    }

    return (
        <div className="scrapbook-screen">
            <div>
                <button onClick={onBack} className="scrapbook-back">
                    ← Back to Love Quest
                </button>

                <section>
                    <h1 className="scrapbook-title">
                        Kevandra Adventures
                    </h1>

                    <div className="scrapbook-book">
                        {isEditing && (
                            <aside className="scrapbook-sidebar">
                                <h2 className="scrapbook-sidebar-title">Bookshelf</h2>

                                <div className="space-y-3">
                                    {books.map((book) => (
                                        <button
                                            key={book.id}
                                            onClick={() => setSelectedBookId(book.id)}
                                            className="scrapbook-soft-button">
                                            📕 {book.title}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-6 border-t border-white/20 pt-4">
                                    <input
                                        value={newBookTitle}
                                        onChange={(e) => setNewBookTitle(e.target.value)}
                                        className="w-full rounded-xl bg-black/60 border-2 border-white/20 px-3 py-2"
                                        placeholder="Book title"
                                    />

                                    <button
                                        onClick={handleCreateBook}
                                        className="scrapbook-soft-button">
                                        + Create Book
                                    </button>
                                </div>
                            </aside>
                        )}

                        <main className="scrapbook-page">
                            {!selectedBook ? (
                                <div className="text-center py-20">
                                    <div className="text-5xl mb-4">📚</div>
                                    <p className="text-xl font-black">
                                        Create your first scrapbook.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                        <div>
                                            <div className="text-sm text-amber-800 font-black">
                                                CURRENT BOOK
                                            </div>
                                            {isEditing ? (
                                                <input
                                                    value={selectedBook.title}
                                                    onChange={(e) => handleSaveBookTitle(e.target.value)}
                                                    className="scrapbook-book-title"
                                                />
                                            ) : (
                                                <h2 className="scrapbook-book-title">
                                                    {selectedBook.title}
                                                </h2>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleAddPage}
                                            className="scrapbook-soft-button"
                                        >
                                            + Add Page
                                        </button>
                                        <button
                                            onClick={() => setIsEditing((value) => !value)}
                                            className="scrapbook-soft-button"
                                        >
                                            {isEditing ? "View Book" : "Edit Page"}
                                        </button>
                                    </div>

                                    {pages.length === 0 ? (
                                        <div className="text-center py-20 border-4 border-dashed border-amber-300 rounded-3xl">
                                            <div className="text-5xl mb-4">📄</div>
                                            <p className="text-xl font-black">
                                                This book has no pages yet.
                                            </p>
                                        </div>
                                    ) : (
                                        <motion.div
                                            key={page?.id}
                                            initial={{ rotateY: -30, opacity: 0 }}
                                            animate={{ rotateY: 0, opacity: 1 }}
                                            transition={{ duration: 0.4 }}
                                            className="relative rounded-sm bg-[#f8edd0] p-8 shadow-[inset_0_0_45px_rgba(120,72,25,0.18),0_20px_40px_rgba(0,0,0,0.25)] border border-[#d6b980]"
                                        >
                                            <div className="text-sm text-amber-800 font-black">
                                                PAGE {currentPage + 1} / {pages.length}
                                            </div>
                                            {isEditing ? (
                                                <input
                                                    value={page?.title ?? ""}
                                                    onChange={(e) => updateCurrentPage({ title: e.target.value })}
                                                    className="mt-4 w-full border-0 border-b border-[#c9a96a] bg-transparent px-1 py-2 text-4xl font-serif font-bold outline-none placeholder:text-stone-400"
                                                />
                                            ) : (
                                                <h3 className="mt-4 text-5xl font-serif font-bold text-stone-900">
                                                    {page?.title}
                                                </h3>
                                            )}
                                            {isEditing && (<>
                                                <button
                                                    onClick={handleAddTextElement}
                                                    className="scrapbook-soft-button"
                                                >
                                                    + Add Text
                                                </button>

                                                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                                                    <label className="rounded-2xl border-4 border-amber-300 bg-amber-100 px-4 py-3 font-black cursor-pointer text-center">
                                                        + Image
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleUploadFile(file, "image");
                                                            }}
                                                        />
                                                    </label>

                                                    <label className="rounded-2xl border-4 border-amber-300 bg-amber-100 px-4 py-3 font-black cursor-pointer text-center">
                                                        + Video
                                                        <input
                                                            type="file"
                                                            accept="video/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleUploadFile(file, "video");
                                                            }}
                                                        />
                                                    </label>

                                                    <label className="rounded-2xl border-4 border-amber-300 bg-amber-100 px-4 py-3 font-black cursor-pointer text-center">
                                                        + Music
                                                        <input
                                                            type="file"
                                                            accept="audio/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleUploadFile(file, "music");
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </>
                                            )}


                                            <div className="mt-5 space-y-4">
                                                {[...(page?.elements ?? [])]
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((element) => (
                                                        <div
                                                            key={element.id}
                                                            className="rounded-sm border border-[#d8bf82] bg-[#fff7df]/70 p-4 shadow-sm"
                                                        >
                                                            {isEditing && (
                                                                <div className="mb-3 flex flex-wrap gap-2 justify-between">
                                                                    <div className="font-black text-amber-900">
                                                                        {element.type.toUpperCase()} ELEMENT
                                                                    </div>

                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => moveElement(element.id, -1)}
                                                                            className="scrapbook-soft-button"
                                                                        >
                                                                            ↑
                                                                        </button>

                                                                        <button
                                                                            onClick={() => moveElement(element.id, 1)}
                                                                            className="scrapbook-soft-button"
                                                                        >
                                                                            ↓
                                                                        </button>

                                                                        <button
                                                                            onClick={() => deleteElement(element.id)}
                                                                            className="scrapbook-soft-button"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {element.type === "text" && (
                                                                isEditing ? (
                                                                    <textarea
                                                                        value={element.content}
                                                                        onChange={(e) =>
                                                                            updateElement(element.id, { content: e.target.value })
                                                                        }
                                                                        placeholder="Write something..."
                                                                        className="scrapbook-textarea"
                                                                    />
                                                                ) : (
                                                                    <p className="scrapbook-read-text">
                                                                        {element.content}
                                                                    </p>
                                                                )
                                                            )}

                                                            {element.type === "image" && (
                                                                <img
                                                                    src={element.content}
                                                                    alt="Scrapbook memory"
                                                                    className="scrapbook-image"
                                                                />
                                                            )}

                                                            {element.type === "video" && (
                                                                <video
                                                                    src={element.content}
                                                                    controls
                                                                    className="rounded-2xl border-4 border-amber-300 max-h-80 w-full bg-black"
                                                                />
                                                            )}

                                                            {element.type === "music" && (
                                                                <audio src={element.content} controls className="w-full" />
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                            {isEditing && (
                                                <button
                                                    onClick={handleSavePage}
                                                    className="scrapbook-soft-button"
                                                >
                                                    Save Page
                                                </button>
                                            )}

                                            <div className="mt-8 flex flex-wrap gap-3">
                                                <button
                                                    onClick={() =>
                                                        setCurrentPage((p) => Math.max(0, p - 1))
                                                    }
                                                    disabled={currentPage === 0}
                                                    className="scrapbook-soft-button"
                                                >
                                                    ← Turn Back
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        setCurrentPage((p) =>
                                                            Math.min(pages.length - 1, p + 1)
                                                        )
                                                    }
                                                    disabled={currentPage === pages.length - 1}
                                                    className="scrapbook-soft-button"
                                                >
                                                    Turn Page →
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </main>
                    </div>
                </section>
            </div>
        </div>
    );
}