import React, { useState, useEffect, useRef } from 'react';
import { Place } from '../../types/place';
import {
  MapPin,
  Utensils,
  Coffee,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  Navigation,
  Compass,
  Heart,
  Sun,
  Moon,
  Cake,
} from 'lucide-react';
import { formatDistance } from '../../utils/distance';
import './PlaceCard.css';

interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  onSelect: (place: Place) => void;
  onViewOnMap: (place: Place) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (placeId: string) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected,
  onSelect,
  onViewOnMap,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 선택 상태가 되었을 때 자동 포커스 및 스크롤
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isSelected]);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(place.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(
    `${place.name} 남양주`
  )}`;

  const kakaoMapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(
    `${place.name} 남양주`
  )}`;

  const getCategoryIcon = () => {
    switch (place.businessCategory) {
      case '음식점':
        return <Utensils size={13} />;
      case '카페·베이커리·디저트':
        return <Coffee size={13} />;
      default:
        return <ShoppingBag size={13} />;
    }
  };

  const getCategoryClass = () => {
    switch (place.businessCategory) {
      case '음식점':
        return 'badge-restaurant';
      case '카페·베이커리·디저트':
        return 'badge-cafe';
      default:
        return 'badge-other';
    }
  };

  const isGeocoded = place.longitude !== null && place.latitude !== null && place.geocodeStatus === '정상';

  return (
    <div
      ref={cardRef}
      id={`place-card-${place.id}`}
      className={`place-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(place)}
      tabIndex={0}
      role="article"
      aria-label={`${place.name} 카드`}
    >
      {/* 카드 상단 헤더 */}
      <div className="place-card-header">
        <div className="card-title-row">
          <div className="title-left">
            <h3 className="place-name">{place.name}</h3>
            {place.distanceKm !== undefined && (
              <span className="distance-badge" title="내 현재 위치로부터의 거리">
                <Navigation size={11} />
                <span>{formatDistance(place.distanceKm)}</span>
              </span>
            )}
          </div>
          {onToggleFavorite && (
            <button
              type="button"
              className={`card-fav-btn ${isFavorite ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(place.id);
              }}
              title={isFavorite ? '찜 해제' : '가고 싶은 곳 찜하기'}
              aria-label="찜하기"
            >
              <Heart size={18} fill={isFavorite ? '#E76F51' : 'none'} color={isFavorite ? '#E76F51' : 'currentColor'} />
            </button>
          )}
        </div>

        {/* 기본 배지: 지역, 업종, 위치확인 */}
        <div className="card-badges">
          <span className="badge badge-region">{place.sourceRegion}</span>
          <span className={`badge ${getCategoryClass()}`}>
            {getCategoryIcon()}
            <span>{place.businessCategory}</span>
          </span>

          {/* 식사 시간대 및 디저트 배지 */}
          {place.mealTypes && place.mealTypes.length > 0 && (
            <div className="card-meal-badges">
              {place.mealTypes.includes('점심') && (
                <span className="badge badge-meal lunch" title="점심 추천 식당">
                  <Sun size={11} />
                  <span>점심</span>
                </span>
              )}
              {place.mealTypes.includes('저녁') && (
                <span className="badge badge-meal dinner" title="저녁 추천 식당">
                  <Moon size={11} />
                  <span>저녁</span>
                </span>
              )}
              {place.mealTypes.includes('디저트') && (
                <span className="badge badge-meal dessert" title="디저트 추천 카페">
                  <Cake size={11} />
                  <span>디저트</span>
                </span>
              )}
            </div>
          )}

          {!isGeocoded && <span className="badge badge-warning">위치 확인 중</span>}
        </div>
      </div>

      {/* 음식 태그 */}
      {place.foodTags && place.foodTags.length > 0 && place.foodTags[0] !== '미분류' && (
        <div className="place-card-tags">
          {place.foodTags.map((tag) => (
            <span key={tag} className="badge badge-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 도로명 주소 */}
      <div className="place-card-address">
        <MapPin size={14} className="address-icon" />
        <span className="address-text">{place.address}</span>
      </div>

      {/* 비고 (메뉴 / 별칭) */}
      {place.note && (
        <div className="place-card-note">
          <span className="note-quote">“</span>
          <span className="note-text">{place.note}</span>
          <span className="note-quote">”</span>
        </div>
      )}

      {/* 카드 하단 액션 버튼 그룹 */}
      <div className="place-card-actions">
        {/* 메인 액션: 지도에서 보기 버튼 */}
        <div className="card-main-action">
          <button
            type="button"
            className="card-action-btn primary"
            onClick={(e) => {
              e.stopPropagation();
              onViewOnMap(place);
            }}
            disabled={!isGeocoded}
            title={isGeocoded ? '지도 위치로 이동' : '좌표 미확인 업소'}
          >
            <Compass size={15} />
            <span>{isGeocoded ? '지도에서 위치 보기' : '위치 확인 중'}</span>
          </button>
        </div>

        {/* 서브 액션: 네이버, 카카오, 주소복사 */}
        <div className="card-sub-actions">
          {/* 네이버 지도 바로가기 */}
          <a
            href={naverMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-action-btn naver"
            onClick={(e) => e.stopPropagation()}
            title="네이버 지도 검색으로 연결"
          >
            <span className="naver-icon-n">N</span>
            <span>네이버</span>
            <ExternalLink size={11} className="link-arrow-icon" />
          </a>

          {/* 카카오맵 바로가기 */}
          <a
            href={kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card-action-btn kakao"
            onClick={(e) => e.stopPropagation()}
            title="카카오맵 검색으로 연결"
          >
            <span className="kakao-icon-k">K</span>
            <span>카카오</span>
            <ExternalLink size={11} className="link-arrow-icon" />
          </a>

          {/* 주소 복사 버튼 */}
          <button
            type="button"
            className={`card-action-btn copy ${copied ? 'copied' : ''}`}
            onClick={handleCopyAddress}
            title="도로명 주소 복사"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? '복사됨' : '주소복사'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
