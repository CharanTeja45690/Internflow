import type { Notice } from '../types';
export function NoticeBox({ notice }: { notice: Notice }) { return notice ? <p className={notice.type}>{notice.text}</p> : null; }
