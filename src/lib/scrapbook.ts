import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "./firebase";

export type ScrapbookBook = {
  id: string;
  title: string;
  coverImageUrl: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ScrapbookElement = {
  id: string;
  type: "text" | "image" | "video" | "music";
  content: string;
  order: number;
};

export type ScrapbookPage = {
  id: string;
  bookId: string;
  pageNumber: number;
  title: string;
  elements: ScrapbookElement[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function getBooks(): Promise<ScrapbookBook[]> {
  const q = query(collection(db, "scrapbookBooks"), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<ScrapbookBook, "id">),
  }));
}

export async function createBook(title: string): Promise<string> {
  const docRef = await addDoc(collection(db, "scrapbookBooks"), {
    title,
    coverImageUrl: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateBook(
  bookId: string,
  updates: Partial<Pick<ScrapbookBook, "title" | "coverImageUrl">>
) {
  await updateDoc(doc(db, "scrapbookBooks", bookId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getPages(bookId: string): Promise<ScrapbookPage[]> {
  const q = query(
    collection(db, "scrapbookBooks", bookId, "pages"),
    orderBy("pageNumber", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    bookId,
    ...(docSnap.data() as Omit<ScrapbookPage, "id" | "bookId">),
  }));
}

export async function createPage(bookId: string, pageNumber: number): Promise<string> {
  const docRef = await addDoc(collection(db, "scrapbookBooks", bookId, "pages"), {
    pageNumber,
    title: "New Page",
    elements: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updatePage(
  bookId: string,
  pageId: string,
  updates: Partial<Pick<ScrapbookPage, "title" | "elements">>
) {
  await updateDoc(doc(db, "scrapbookBooks", bookId, "pages", pageId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function uploadScrapbookFile(
  bookId: string,
  pageId: string,
  file: File
): Promise<string> {
  const safeName = `${Date.now()}-${file.name.replaceAll(" ", "-")}`;
  const fileRef = ref(storage, `scrapbooks/${bookId}/pages/${pageId}/${safeName}`);

  await uploadBytes(fileRef, file, {
    contentType: file.type,
  });

  return getDownloadURL(fileRef);
}