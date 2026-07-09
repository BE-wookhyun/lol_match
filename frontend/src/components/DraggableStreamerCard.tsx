import { useDraggable } from '@dnd-kit/core';
import type { Streamer } from '../types';
import StreamerCard from './StreamerCard';

interface DraggableStreamerCardProps {
  streamer: Streamer;
}

export default function DraggableStreamerCard({ streamer }: DraggableStreamerCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pool-${streamer.seq}`,
    data: { streamer },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative' as const,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <StreamerCard streamer={streamer} />
    </div>
  );
}
