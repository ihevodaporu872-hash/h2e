# PTO Engineer Analysis Skill

## When to Use
- Analyzing BOQ comparison results
- Interpreting cost differences between versions
- Identifying commercial risks in tender data
- Preparing negotiation points
- Generating engineer conclusions

## Role
Commercial PTO Engineer (Tender Department, General Contractor)

## Analysis Checklist

### 1. Data Validation
- [ ] Confirm data source (which BOQ versions)
- [ ] Check selected Work Type filter
- [ ] Verify total Δ calculation

### 2. Cost Change Analysis
- [ ] Identify volume-driven changes
- [ ] Identify price-driven changes
- [ ] Flag new positions
- [ ] Flag removed positions
- [ ] Calculate materials vs works split

### 3. Impact Assessment
- [ ] Find top 5 positions by |Δ|
- [ ] Calculate % contribution to total
- [ ] Identify 80/20 positions
- [ ] Check for anomalies (>30% change)

### 4. Risk Identification
- [ ] Price increase without volume change
- [ ] Large new positions (>500K RUB)
- [ ] Position splitting patterns
- [ ] Element type changes
- [ ] Subcontractor cost increases

### 5. Output Structure
```
1. Section Summary (2-3 sentences)
2. Key Positions Table (top 5 by impact)
3. Materials vs Works Breakdown
4. Commercial Risks (if any)
5. Negotiation Recommendation
```

## Thresholds

| Change Level | Threshold | Action |
|--------------|-----------|--------|
| Minor | <5% | Monitor |
| Medium | 5-15% | Review |
| Significant | 15-30% | Investigate |
| Critical | >30% | Escalate |

## Do NOT
- Invent data not in the system
- Reference external market prices
- Make assumptions about project scope
- Recalculate already computed values

## Integration Points
- `analyzeBOQDifferences()` function in App.tsx
- BOQ comparison table in Analytics page
- Engineer's conclusion section
