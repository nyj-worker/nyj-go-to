import React, { useState, useEffect, useMemo } from 'react';
import { Place } from '../../types/place';
import {
  Dices,
  X,
  Sparkles,
  Compass,
  ExternalLink,
  RotateCcw,
  MapPin,
  Sun,
  Moon,
  Cake,
  ArrowLeft,
  Utensils
} from 'lucide-react';
import './RandomRouletteModal.css';

// 남양주시 16개 읍면동 목록 (가나다순)
const REGION_OPTIONS = [
  '전체',
  '금곡동',
  '다산동',
  '별내동',
  '별내면',
  '삼패동',
  '수석동',
  '오남읍',
  '와부읍',
  '일패동',
  '조안면',
  '진건읍',
  '진접읍',
  '퇴계원읍',
  '평내동',
  '호평동',
  '화도읍',
];

export type MealType = 'lunch' | 'dinner' | 'dessert';

interface RandomRouletteModalProps {
  places: Place[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  initialRegion?: string;
}

// 식당의 식사 유형(점심, 저녁, 디저트) 적합 여부 판별 함수
const isPlaceSuitableForMeal = (place: Place, mealType: MealType): boolean => {
  // 1. CSV 데이터 기반 mealTypes가 존재하는 경우 (우선 적용)
  if (place.mealTypes && place.mealTypes.length > 0) {
    if (mealType === 'lunch') return place.mealTypes.includes('점심');
    if (mealType === 'dinner') return place.mealTypes.includes('저녁');
    if (mealType === 'dessert') return place.mealTypes.includes('디저트');
  }

  // 2. 만약 mealTypes 정보가 없는 경우 안전한 Fallback 규칙
  if (mealType === 'dessert') {
    return place.businessCategory === '카페·베이커리·디저트' || place.foodTags.some(t => ['카페', '베이커리', '디저트'].includes(t));
  }
  if (mealType === 'lunch') {
    return place.businessCategory === '음식점' || place.businessCategory === '기타 먹거리';
  }
  if (mealType === 'dinner') {
    return place.businessCategory === '음식점' || place.businessCategory === '기타 먹거리';
  }
  return true;
};

export const RandomRouletteModal: React.FC<RandomRouletteModalProps> = ({
  places,
  isOpen,
  onClose,
  onSelectPlace,
  initialRegion,
}) => {
  // 모달 단계: 'select' (점심/저녁/디저트 선택) 또는 'roulette' (룰렛 추첨 및 결과)
  const [phase, setPhase] = useState<'select' | 'roulette'>('select');
  const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion || '전체');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [isRolling, setIsRolling] = useState(false);
  const [displayCandidate, setDisplayCandidate] = useState<Place | null>(null);
  const [selectedResult, setSelectedResult] = useState<Place | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // 모달이 열릴 때마다 'select' 단계로 초기화하여 항상 점심/저녁/디저트를 먼저 선택하도록 유도
  useEffect(() => {
    if (isOpen) {
      setPhase('select');
      setSelectedResult(null);
      setDisplayCandidate(null);
      setIsRolling(false);
      if (initialRegion && initialRegion.trim() !== '') {
        setSelectedRegion(initialRegion);
      } else {
        setSelectedRegion('전체');
      }
    }
  }, [isOpen, initialRegion]);

  // 각 읍면동별 업소 수 집계 (드롭다운 옵션 표시용)
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    places.forEach((p) => {
      counts[p.sourceRegion] = (counts[p.sourceRegion] || 0) + 1;
    });
    return counts;
  }, [places]);

  // 현재 선택된 지역 내의 업소 목록
  const placesInRegion = useMemo(() => {
    if (!places || places.length === 0) return [];
    if (selectedRegion === '전체') return places;
    const filtered = places.filter((p) => p.sourceRegion === selectedRegion);
    return filtered.length > 0 ? filtered : places;
  }, [places, selectedRegion]);

  // 현재 지역 내 점심, 저녁, 디저트 후보 수 집계 (선택 카드 배지용)
  const categoryCounts = useMemo(() => {
    return {
      lunch: placesInRegion.filter((p) => isPlaceSuitableForMeal(p, 'lunch')).length,
      dinner: placesInRegion.filter((p) => isPlaceSuitableForMeal(p, 'dinner')).length,
      dessert: placesInRegion.filter((p) => isPlaceSuitableForMeal(p, 'dessert')).length,
    };
  }, [placesInRegion]);

  // 현재 선택된 지역 및 식사 유형에 맞는 룰렛 후보군
  const candidatePlaces = useMemo(() => {
    if (!placesInRegion || placesInRegion.length === 0) return [];
    const matched = placesInRegion.filter((p) => isPlaceSuitableForMeal(p, mealType));

    // 만약 해당 지역에 해당 카테고리가 0건인 경우 전체 지역으로 폴백
    if (matched.length === 0) {
      const globalMatched = places.filter((p) => isPlaceSuitableForMeal(p, mealType));
      if (globalMatched.length > 0) {
        setIsFallbackMode(true);
        return globalMatched;
      }
      setIsFallbackMode(true);
      return placesInRegion;
    } else {
      setIsFallbackMode(false);
      return matched;
    }
  }, [places, placesInRegion, mealType]);

  // 룰렛 회전 애니메이션 시작
  const startRoulette = (candidates: Place[] = candidatePlaces) => {
    if (candidates.length === 0) return;
    setIsRolling(true);
    setSelectedResult(null);

    let counter = 0;
    const maxIterations = 24;
    const intervalTime = 60;

    const timer = setInterval(() => {
      counter++;
      const randomIdx = Math.floor(Math.random() * candidates.length);
      setDisplayCandidate(candidates[randomIdx]);

      if (counter >= maxIterations) {
        clearInterval(timer);
        const finalPlace = candidates[Math.floor(Math.random() * candidates.length)];
        setDisplayCandidate(finalPlace);
        setSelectedResult(finalPlace);
        setIsRolling(false);
      }
    }, intervalTime);
  };

  // 1단계 선택 화면에서 [점심], [저녁], [디저트] 카드를 클릭했을 때 실행
  const handleSelectMealType = (type: MealType) => {
    setMealType(type);
    setPhase('roulette');

    // 선택된 유형에 맞춰 후보군을 즉시 계산하고 룰렛 가동
    const matched = placesInRegion.filter((p) => isPlaceSuitableForMeal(p, type));
    const targetList = matched.length > 0
      ? matched
      : places.filter((p) => isPlaceSuitableForMeal(p, type));

    startRoulette(targetList.length > 0 ? targetList : placesInRegion);
  };

  // 2단계 결과 화면에서 상단 탭을 전환했을 때
  const handleSwitchTab = (type: MealType) => {
    if (isRolling || mealType === type) return;
    setMealType(type);

    const matched = placesInRegion.filter((p) => isPlaceSuitableForMeal(p, type));
    const targetList = matched.length > 0
      ? matched
      : places.filter((p) => isPlaceSuitableForMeal(p, type));

    startRoulette(targetList.length > 0 ? targetList : placesInRegion);
  };

  // 지역 드롭다운 변경 시
  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    if (phase === 'roulette') {
      const nextInRegion = newRegion === '전체' ? places : places.filter((p) => p.sourceRegion === newRegion);
      const matched = nextInRegion.filter((p) => isPlaceSuitableForMeal(p, mealType));
      const targetList = matched.length > 0 ? matched : (nextInRegion.length > 0 ? nextInRegion : places);
      startRoulette(targetList);
    }
  };

  if (!isOpen) return null;

  const currentPlace = selectedResult || displayCandidate || candidatePlaces[0];

  return (
    <div className="roulette-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="roulette-modal-title">
      <div className="roulette-modal-card">
        {/* 모달 공통 상단 헤더 */}
        <div className="roulette-modal-header">
          <div className="roulette-title-group">
            {phase === 'roulette' ? (
              <button
                type="button"
                className="roulette-back-btn"
                onClick={() => {
                  if (!isRolling) setPhase('select');
                }}
                disabled={isRolling}
                title="카테고리 다시 선택하기"
                aria-label="카테고리 다시 선택하기"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <Dices className="roulette-icon" size={24} />
            )}
            <h3 id="roulette-modal-title">오늘 뭐 먹지? 맛집 룰렛</h3>
          </div>
          <button type="button" className="roulette-close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {/* 1단계: 점심, 저녁, 디저트 사전 선택 화면 */}
        {phase === 'select' && (
          <div className="roulette-selection-container">
            <div className="selection-intro">
              <span className="selection-badge">
                <Sparkles size={14} /> 맞춤 맛집 룰렛
              </span>
              <h2 className="selection-title">오늘 어떤 메뉴를 찾으시나요?</h2>
              <p className="selection-subtitle">
                점심, 저녁, 디저트 중 원하는 상황을 선택하시면 남양주 맛집을 뽑아드립니다.
              </p>
            </div>

            {/* 지역 설정 */}
            <div className="selection-region-bar">
              <label htmlFor="selection-region-select" className="region-select-label">
                <MapPin size={15} className="region-pin-icon" />
                <span>추천 희망 지역</span>
              </label>
              <div className="select-wrapper">
                <select
                  id="selection-region-select"
                  className="selection-region-select"
                  value={selectedRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                >
                  <option value="전체">남양주시 전체 ({places.length}곳)</option>
                  {REGION_OPTIONS.filter((r) => r !== '전체').map((region) => (
                    <option key={region} value={region}>
                      {region} ({regionCounts[region] || 0}곳)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3대 테마 선택 카드 리스트 */}
            <div className="meal-choice-grid">
              {/* 1. 점심 카드 */}
              <button
                type="button"
                className="meal-choice-card lunch-card"
                onClick={() => handleSelectMealType('lunch')}
              >
                <div className="card-top-row">
                  <div className="meal-icon-circle lunch">
                    <Sun size={26} />
                  </div>
                  <span className="choice-count-pill">{categoryCounts.lunch}곳 후보</span>
                </div>
                <div className="card-content">
                  <h4 className="meal-choice-name">☀️ 든든한 점심</h4>
                  <p className="meal-choice-desc">점심특선, 순대국, 칼국수, 초밥, 돈까스 등</p>
                </div>
                <div className="card-footer-action">
                  <span>점심 룰렛 돌리기</span>
                  <Sparkles size={14} />
                </div>
              </button>

              {/* 2. 저녁 카드 */}
              <button
                type="button"
                className="meal-choice-card dinner-card"
                onClick={() => handleSelectMealType('dinner')}
              >
                <div className="card-top-row">
                  <div className="meal-icon-circle dinner">
                    <Moon size={26} />
                  </div>
                  <span className="choice-count-pill">{categoryCounts.dinner}곳 후보</span>
                </div>
                <div className="card-content">
                  <h4 className="meal-choice-name">🌙 맛있는 저녁</h4>
                  <p className="meal-choice-desc">숯불갈비, 삼겹살, 오리·장어구이, 다이닝 등</p>
                </div>
                <div className="card-footer-action">
                  <span>저녁 룰렛 돌리기</span>
                  <Sparkles size={14} />
                </div>
              </button>

              {/* 3. 디저트 카드 */}
              <button
                type="button"
                className="meal-choice-card dessert-card"
                onClick={() => handleSelectMealType('dessert')}
              >
                <div className="card-top-row">
                  <div className="meal-icon-circle dessert">
                    <Cake size={26} />
                  </div>
                  <span className="choice-count-pill">{categoryCounts.dessert}곳 후보</span>
                </div>
                <div className="card-content">
                  <h4 className="meal-choice-name">🍰 달콤한 디저트</h4>
                  <p className="meal-choice-desc">대형 베이커리 카페, 리버뷰 카페, 구움과자 등</p>
                </div>
                <div className="card-footer-action">
                  <span>디저트 룰렛 돌리기</span>
                  <Sparkles size={14} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 2단계: 룰렛 회전 및 결과 화면 */}
        {phase === 'roulette' && (
          <>
            {/* 상단 컨트롤 패널 */}
            <div className="roulette-controls-panel">
              {/* 지역 선택 행 */}
              <div className="roulette-control-row">
                <label htmlFor="roulette-region-select" className="control-label">
                  <MapPin size={15} className="control-label-icon" />
                  <span>지역 설정</span>
                </label>
                <div className="select-wrapper">
                  <select
                    id="roulette-region-select"
                    className="roulette-region-select"
                    value={selectedRegion}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    disabled={isRolling}
                  >
                    <option value="전체">남양주시 전체 ({places.length}곳)</option>
                    {REGION_OPTIONS.filter((r) => r !== '전체').map((region) => (
                      <option key={region} value={region}>
                        {region} ({regionCounts[region] || 0}곳)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 점심 / 저녁 / 디저트 즉시 전환 탭 */}
              <div className="roulette-control-row">
                <span className="control-label">
                  <Utensils size={15} className="control-label-icon" />
                  <span>카테고리</span>
                </span>
                <div className="roulette-meal-tabs" role="radiogroup" aria-label="추천 테마 선택">
                  <button
                    type="button"
                    className={`meal-tab-btn ${mealType === 'lunch' ? 'active lunch' : ''}`}
                    onClick={() => handleSwitchTab('lunch')}
                    disabled={isRolling}
                    role="radio"
                    aria-checked={mealType === 'lunch'}
                  >
                    <Sun size={15} className="meal-icon-sun" />
                    <span>점심</span>
                  </button>
                  <button
                    type="button"
                    className={`meal-tab-btn ${mealType === 'dinner' ? 'active dinner' : ''}`}
                    onClick={() => handleSwitchTab('dinner')}
                    disabled={isRolling}
                    role="radio"
                    aria-checked={mealType === 'dinner'}
                  >
                    <Moon size={15} className="meal-icon-moon" />
                    <span>저녁</span>
                  </button>
                  <button
                    type="button"
                    className={`meal-tab-btn ${mealType === 'dessert' ? 'active dessert' : ''}`}
                    onClick={() => handleSwitchTab('dessert')}
                    disabled={isRolling}
                    role="radio"
                    aria-checked={mealType === 'dessert'}
                  >
                    <Cake size={15} className="meal-icon-cake" />
                    <span>디저트</span>
                  </button>
                </div>
              </div>

              {/* 현재 조건 요약 */}
              <div className="roulette-filter-summary">
                <span className="summary-region-chip">{selectedRegion}</span>
                <span className="summary-dot">•</span>
                <span className={`summary-meal-chip ${mealType}`}>
                  {mealType === 'lunch' && '☀️ 점심 추천'}
                  {mealType === 'dinner' && '🌙 저녁 추천'}
                  {mealType === 'dessert' && '🍰 디저트·카페'}
                </span>
                <span className="summary-count">
                  후보 <strong>{candidatePlaces.length}</strong>곳 중 추첨
                </span>
                {isFallbackMode && (
                  <span className="summary-fallback-notice">(해당 지역 메뉴가 적어 남양주 전체로 확장)</span>
                )}
              </div>
            </div>

            {/* 룰렛 디스플레이 영역 */}
            <div className="roulette-display-area">
              <div className={`roulette-result-box ${isRolling ? 'rolling' : 'winner'} theme-${mealType}`}>
                {/* 추천 테마 뱃지 */}
                <div className="roulette-badge-row">
                  <span className="roulette-region-badge">{currentPlace?.sourceRegion}</span>
                  {!isRolling && (
                    <span className={`meal-recommend-badge ${mealType}`}>
                      {mealType === 'lunch' && '☀️ 든든한 점심 추천!'}
                      {mealType === 'dinner' && '🌙 맛있는 저녁 외식 추천!'}
                      {mealType === 'dessert' && '🍰 달콤한 디저트 추천!'}
                    </span>
                  )}
                </div>

                <h2 className="roulette-place-name">{currentPlace?.name}</h2>
                <span className="roulette-category-badge">{currentPlace?.businessCategory}</span>

                {/* 음식 태그 칩 */}
                {currentPlace?.foodTags && currentPlace.foodTags.length > 0 && (
                  <div className="roulette-food-tags">
                    {currentPlace.foodTags.map((tag) => (
                      <span key={tag} className="roulette-food-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {currentPlace?.note && (
                  <p className="roulette-note">“{currentPlace.note}”</p>
                )}

                <p className="roulette-address">{currentPlace?.address}</p>

                {!isRolling && selectedResult && (
                  <div className="winner-badge">
                    <Sparkles size={14} />
                    <span>남양주시 공식 맛집 데이터 선정 업소</span>
                  </div>
                )}
              </div>
            </div>

            {/* 모달 액션 푸터 */}
            <div className="roulette-modal-footer">
              <button
                type="button"
                className="roulette-rerun-btn"
                onClick={() => startRoulette()}
                disabled={isRolling}
              >
                <RotateCcw size={16} className={isRolling ? 'spinning' : ''} />
                <span>다른 맛집 다시 뽑기</span>
              </button>

              {selectedResult && (
                <div className="roulette-action-group">
                  <button
                    type="button"
                    className="roulette-view-map-btn"
                    onClick={() => {
                      onSelectPlace(selectedResult);
                      onClose();
                    }}
                  >
                    <Compass size={16} />
                    <span>지도에서 위치 확인하기</span>
                  </button>

                  <div className="roulette-links-subgroup">
                    <a
                      href={`https://map.naver.com/v5/search/${encodeURIComponent(
                        `${selectedResult.name} 남양주`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="roulette-naver-link"
                      aria-label={`${selectedResult.name} 네이버지도 새 창에서 열기`}
                    >
                      <span>네이버지도</span>
                      <ExternalLink size={13} />
                    </a>

                    <a
                      href={`https://map.kakao.com/link/search/${encodeURIComponent(
                        `${selectedResult.name} 남양주`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="roulette-kakao-link"
                      aria-label={`${selectedResult.name} 카카오맵 새 창에서 열기`}
                    >
                      <span>카카오맵</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
