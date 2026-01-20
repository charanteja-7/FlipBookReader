'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { getBook, updateBookProgress } from '@/lib/storage';
import ReaderControls from '@/components/Reader/ReaderControls';
import dynamic from 'next/dynamic';

const FlipBook = dynamic(() => import('@/components/Reader/FlipBook'), {
    ssr: false,
    loading: () => <div style={{ color: 'var(--text-secondary)' }}>Loading Reader...</div>
});

export default function ReaderPage({ params }) {
    // Params in Next.js 15+ (if using that) are promises, but in 14 they are objects.
    // We should unwrap params if needed. Assuming Next.js 14/15 behavior. 
    // Safety: handle both or check. 
    // To be safe with "use client" on Next 15, we can use React.use() if params is a promise.
    // But let's assume standard behavior for now. 

    // Note: App Router params in client components: 
    // in Next 15, `params` is a Promise. In 14, it is an object.
    // The `use` hook handles the Promise case.
    const { id } = use(params);

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('sepia'); // default realistic
    const router = useRouter();

    useEffect(() => {
        const loadBook = async () => {
            try {
                if (!id) return;
                const data = await getBook(id);
                if (!data) {
                    console.error("Book not found");
                    router.push('/');
                    return;
                }
                setBook(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadBook();
    }, [id, router]);

    // Theme application
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        // Cleanup
        return () => document.documentElement.removeAttribute('data-theme');
    }, [theme]);

    const handleFlip = useCallback((pageIndex) => {
        if (book) {
            // Debounce this in real app
            updateBookProgress(book.id, pageIndex);
        }
    }, [book]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }}>Loading library...</div>;
    if (!book) return null;

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <ReaderControls
                title={book.title}
                currentPage={book.lastReadPage}
                totalPages={100} // We need to get total pages from FlipBook callback really
                theme={theme}
                onSetTheme={setTheme}
            />

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '60px' }}>
                <FlipBook
                    file={book.fileBlob}
                    initialPage={book.lastReadPage || 0}
                    onFlip={handleFlip}
                />
            </div>
        </div>
    );
}
