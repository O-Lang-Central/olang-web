// app/embed/page.tsx (SERVER component - NO 'use client')
import EmbedClient from './EmbedClient';

export const metadata = {
  title: 'Embed O-Lang Chatbot | O-Lang',
  description: 'Add a governed AI assistant to any website in 60 seconds.',
};

export default function EmbedPage() {
  return <EmbedClient />;
}