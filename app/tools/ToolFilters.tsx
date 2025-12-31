'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ToolItem } from '@/lib/types';

const SORT_OPTIONS = [
  { value: 'kode-asc', label: 'Kode (A-Z)' },
  { value: 'kode-desc', label: 'Kode (Z-A)' },
  { value: 'nama-asc', label: 'Nama (A-Z)' },
  { value: 'nama-desc', label: 'Nama (Z-A)' },
  { value: 'created-desc', label: 'Terbaru' }
];

type ToolFiltersProps = {
  kategoriOptions: string[];
  lokasiOptions: string[];
  kondisiOptions: ToolItem['kondisi'][];
  initialQuery: {
    q: string;
    kategori: string;
    lokasi: string;
    kondisi: string;
    aktif: string;
    sort: string;
  };
};

export default function ToolFilters({ kategoriOptions, lokasiOptions, kondisiOptions, initialQuery }: ToolFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialQuery.q);

  const paramsString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    setSearchTerm(initialQuery.q);
  }, [initialQuery.q, paramsString]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) {
        params.set('q', searchTerm.trim());
      } else {
        params.delete('q');
      }
      params.set('page', '1');
      router.replace(`/tools?${params.toString()}`);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchTerm, router, searchParams]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.replace(`/tools?${params.toString()}`);
  };

  const resetFilters = () => {
    router.replace('/tools');
  };

  return (
    <div className="row g-2 align-items-end">
      <div className="col-lg-4">
        <label className="form-label">Cari kode/nama</label>
        <input
          className="form-control"
          placeholder="Cari kode atau nama alat"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
        />
      </div>
      <div className="col-lg-3 col-md-6">
        <label className="form-label">Kategori</label>
        <select
          className="form-select"
          value={initialQuery.kategori}
          onChange={event => updateParam('kategori', event.target.value)}
        >
          <option value="">Semua kategori</option>
          {kategoriOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="col-lg-3 col-md-6">
        <label className="form-label">Lokasi</label>
        <select
          className="form-select"
          value={initialQuery.lokasi}
          onChange={event => updateParam('lokasi', event.target.value)}
        >
          <option value="">Semua lokasi</option>
          {lokasiOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="col-lg-2 col-md-6">
        <label className="form-label">Kondisi</label>
        <select
          className="form-select"
          value={initialQuery.kondisi}
          onChange={event => updateParam('kondisi', event.target.value)}
        >
          <option value="">Semua kondisi</option>
          {kondisiOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="col-lg-2 col-md-6">
        <label className="form-label">Status aktif</label>
        <select
          className="form-select"
          value={initialQuery.aktif}
          onChange={event => updateParam('aktif', event.target.value)}
        >
          <option value="">Semua</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>
      <div className="col-lg-3 col-md-6">
        <label className="form-label">Urutkan</label>
        <select
          className="form-select"
          value={initialQuery.sort || 'kode-asc'}
          onChange={event => updateParam('sort', event.target.value)}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-lg-2 col-md-6 d-grid">
        <button type="button" className="btn btn-outline-secondary" onClick={resetFilters}>
          Reset filter
        </button>
      </div>
    </div>
  );
}
