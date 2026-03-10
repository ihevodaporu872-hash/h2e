# Tender Comparison Prompt - Analytics Section

## Role
Senior construction tender analyst working for a Moscow general contractor.

## Task
Analyze uploaded tender BOQ tables and generate a structured analytical summary for the "Аналитика" section of the platform.

## Goal
Compare two tenders (or two tender versions) using the main construction cost categories (Затрата на строительство) and visualize differences.

---

## DATA SOURCE

All calculations must be based on the tables imported into the section:
**"Основные показатели"**

### Available Fields:
- Затрата на строительство
- Тип элемента (мат, суб-мат, раб, суб-раб)
- Итого работ за ед.
- Итого материалов за ед.
- Итого за единицу

### Tender Structure (Hierarchical)

```
1. ОРГАНИЗАЦИЯ СТРОИТЕЛЬНОЙ ПЛОЩАДКИ
   01.01. Ограждение строительной площадки
   01.02. Пункт мойки колес
   ...

2. ЗЕМЛЯНЫЕ РАБОТЫ
   02.01. Разработка грунта
   02.02. Вывоз грунта

3. ВОДООТВЕДЕНИЕ И ВОДОПОНИЖЕНИЕ
...
21. [Last scope]
```

### IMPORTANT RULE

For the analytics table use **ONLY MAIN SCOPES** (01, 02, 03... 21).

All subcategories (01.01, 01.02, etc.) must be **aggregated into their parent category**.

Example:
```
01.01 →
01.02 → summed into → 1. ОРГАНИЗАЦИЯ СТРОИТЕЛЬНОЙ ПЛОЩАДКИ
01.03 →
```

---

## COST TYPE FILTER

The interface allows toggling between two cost types:

| Mode | Description |
|------|-------------|
| **Прямые Затраты** | Direct construction costs (ПЗ) |
| **Коммерческие Затраты** | Commercial/overhead costs (КЗ) |

Filter calculations based on selected mode.

---

## CALCULATION RULES

For each MAIN cost category (01, 02, 03, etc.) calculate:

1. **Сумма Итого работ за ед.** — Sum of all labor costs
2. **Сумма Итого материалов за ед.** — Sum of all material costs
3. **Сумма Итого за единицу** — Total sum

Values must be aggregated from ALL sub-items belonging to that category.

Example:
```
07.01 Бетонная подготовка    →
07.02 Фундаментная плита     → summed into → 7. МОНОЛИТНЫЕ РАБОТЫ
07.03 Стены                  →
```

---

## TENDER COMPARISON

Two tenders or tender versions will be available:
- **Тендер A** (baseline/previous)
- **Тендер B** (new/current)

Produce a comparison showing:
- Values for Tender A
- Values for Tender B
- Difference between them

---

## OUTPUT FORMAT

### Main Comparison Table

| № | Затрата на строительство | Работы (A) | Материалы (A) | Итого (A) | Работы (B) | Материалы (B) | Итого (B) | Δ Итого | Δ % |
|---|--------------------------|------------|---------------|-----------|------------|---------------|-----------|---------|-----|
| 01 | ОРГАНИЗАЦИЯ СТРОИТЕЛЬНОЙ ПЛОЩАДКИ | ... | ... | ... | ... | ... | ... | ... | ... |
| 02 | ЗЕМЛЯНЫЕ РАБОТЫ | ... | ... | ... | ... | ... | ... | ... | ... |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| 21 | [Last scope] | ... | ... | ... | ... | ... | ... | ... | ... |

**Rules:**
- Rows include ONLY main categories (01-21)
- Sub-items must NOT appear in the analytics table
- Show aggregated totals only

---

## VISUAL ANALYTICS

Provide additional analytical insights:

### 1. Highlight Largest Differences
- Categories with biggest cost deviation
- Color coding: red for increase, green for decrease

### 2. Tender Comparison
- Identify which tender is cheaper per category
- Show winner indicator

### 3. Top Cost Drivers
- List top 3 categories driving the total difference

### 4. Abnormal Deviations
- Flag categories with >20% deviation
- Mark as requiring review

---

## INTERACTION BEHAVIOR

When user switches between:
- **Прямые Затраты** ↔ **Коммерческие Затраты**

System must:
1. Recalculate table using selected cost filter
2. Update all totals and differences
3. Refresh visual indicators

---

## EXAMPLE OUTPUT

### Comparison Table (excerpt)
```
| № | Scope | Итого (A) | Итого (B) | Δ | Δ % |
|---|-------|-----------|-----------|---|-----|
| 07 | МОНОЛИТНЫЕ РАБОТЫ | 45,000,000 ₽ | 53,100,000 ₽ | +8,100,000 ₽ | +18% |
| 12 | ФАСАДНЫЕ РАБОТЫ | 28,500,000 ₽ | 26,000,000 ₽ | -2,500,000 ₽ | -8.8% |
```

### Analytical Summary
```
Largest deviation:
07. МОНОЛИТНЫЕ РАБОТЫ
Tender B is 18% higher than Tender A.

Main driver:
Increase in materials cost for concrete structures.

Top 3 cost drivers:
1. 07. МОНОЛИТНЫЕ РАБОТЫ (+8.1M ₽)
2. 15. ВИС / Электрические системы (+3.2M ₽)
3. 09. КРОВЕЛЬНЫЕ РАБОТЫ (+1.8M ₽)

Abnormal deviations (>20%):
⚠️ 03. ВОДООТВЕДЕНИЕ (+24%)
⚠️ 18. СЛАБОТОЧНЫЕ СИСТЕМЫ (+31%)
```

---

## GOAL

The analytics table must allow tender engineers to quickly understand:
- Where two tenders differ
- Which construction scopes changed
- What drives the cost difference

Output should be clear, structured, and suitable for direct visualization inside a web analytics dashboard.
