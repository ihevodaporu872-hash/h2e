# Tender Comparison Skill - Analytics Section

## When to Use
- Comparing two tender versions
- Analyzing cost differences between projects
- Generating aggregated scope comparison tables
- Identifying cost drivers and abnormal deviations

## Main Scopes (Moscow Standard)

Only these 21 main categories appear in comparison table:

| № | Scope Name |
|---|------------|
| 01 | ОРГАНИЗАЦИЯ СТРОИТЕЛЬНОЙ ПЛОЩАДКИ |
| 02 | ЗЕМЛЯНЫЕ РАБОТЫ |
| 03 | ВОДООТВЕДЕНИЕ И ВОДОПОНИЖЕНИЕ |
| 04 | СВАЙНЫЕ РАБОТЫ |
| 05 | УСТРОЙСТВО КОТЛОВАНА |
| 06 | КЛАДОЧНЫЕ РАБОТЫ |
| 07 | МОНОЛИТНЫЕ РАБОТЫ |
| 08 | МЕТАЛЛОКОНСТРУКЦИИ |
| 09 | КРОВЕЛЬНЫЕ РАБОТЫ |
| 10 | ФАСАДНЫЕ РАБОТЫ |
| 11 | ГИДРОИЗОЛЯЦИЯ |
| 12 | ОТДЕЛОЧНЫЕ РАБОТЫ |
| 13 | ДВЕРИ, ЛЮКИ, ВОРОТА |
| 14 | ВИС / Механические системы |
| 15 | ВИС / Электрические системы |
| 16 | НАРУЖНЫЕ ИНЖЕНЕРНЫЕ СЕТИ |
| 17 | СЛАБОТОЧНЫЕ СИСТЕМЫ |
| 18 | ЛИФТОВОЕ ОБОРУДОВАНИЕ |
| 19 | БЛАГОУСТРОЙСТВО |
| 20 | ПРОЧИЕ РАБОТЫ |
| 21 | ВРЕМЕННЫЕ СООРУЖЕНИЯ |

## Aggregation Rules

### Sub-item to Parent Mapping
```
XX.01, XX.02, XX.03... → XX (Main Scope)

Example:
07.01 Бетонная подготовка
07.02 Фундаментная плита  → 07. МОНОЛИТНЫЕ РАБОТЫ
07.03 Стены
```

### Aggregation Formula
```
Main Scope Total = Σ (all sub-items)

For each main scope:
- Работы = sum(sub.Работы)
- Материалы = sum(sub.Материалы)
- Итого = sum(sub.Итого)
```

## Cost Type Filter

| Filter | Source Columns |
|--------|----------------|
| Прямые Затраты (ПЗ) | pzLabor, pzMaterial, pzTotal |
| Коммерческие Затраты (КЗ) | kzLabor, kzMaterial, kzTotal |

## Comparison Table Structure

```typescript
interface ScopeComparison {
  scopeNumber: string;        // "01", "02", etc.
  scopeName: string;          // Full name
  laborA: number;             // Tender A labor
  materialA: number;          // Tender A materials
  totalA: number;             // Tender A total
  laborB: number;             // Tender B labor
  materialB: number;          // Tender B materials
  totalB: number;             // Tender B total
  diffAbsolute: number;       // Δ in rubles
  diffPercent: number;        // Δ in %
  isAbnormal: boolean;        // >20% flag
}
```

## Visual Indicators

### Color Coding
| Condition | Color |
|-----------|-------|
| Δ > 0 (increase) | Red |
| Δ < 0 (decrease) | Green |
| Δ = 0 | Gray |
| Δ > 20% | Orange warning |
| Δ > 30% | Red critical |

### Winner Indicator
- ✓ Tender A wins (cheaper)
- ✓ Tender B wins (cheaper)
- = Equal

## Deviation Thresholds

| Level | Threshold | Action |
|-------|-----------|--------|
| Normal | <10% | No flag |
| Moderate | 10-20% | Yellow |
| Abnormal | 20-30% | Orange, review needed |
| Critical | >30% | Red, investigation required |

## Analytics Output Checklist

- [ ] Show main scopes only (01-21)
- [ ] Aggregate sub-items correctly
- [ ] Apply cost type filter
- [ ] Calculate absolute difference
- [ ] Calculate percentage difference
- [ ] Flag abnormal deviations
- [ ] Identify top 3 cost drivers
- [ ] Generate summary text
- [ ] Highlight largest deviation

## Integration Points

- `renderAnalyticsPage()` in App.tsx
- `TenderProject` and `TenderFile` data structures
- Cost type selector (ПЗ/КЗ toggle)
- Comparison table component
