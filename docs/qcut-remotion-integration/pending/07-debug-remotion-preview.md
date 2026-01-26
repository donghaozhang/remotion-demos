# 07 - Debug: Remotion Preview Not Rendering

> **Date:** 2026-01-26
> **Status:** Investigation
> **Issue:** Skills Demo component on timeline shows gradient background but no content

---

## Observed Behavior

```
┌─────────────────────────────────────────────────────────────────┐
│                       QCut Editor                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Preview shows:                                                │
│   ┌─────────────────────┐                                       │
│   │   Gradient bg only  │  ← Should show terminal animation    │
│   │   (pink/purple)     │                                       │
│   │   No content        │                                       │
│   └─────────────────────┘                                       │
│                                                                 │
│   Timeline:                                                     │
│   [Skills Demo ████████████████████] 18.0s                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Console Warnings (from screenshot)

```
⚠ Note: Some companies are required to obtain a license to use Remotion.
  See: https://remotion.dev/license
  Pass the 'acknowledgeRemotionLicense' prop to '<Player />' function
  to make this message disappear.

⚠ Canvas2D: Multiple readback operations using getImageData are faster
  with the willReadFrequently attribute set to true.
```

---

## Rendering Pipeline Analysis

### Step 1: Preview Panel Calls RemotionPreview

**File:** `preview-panel.tsx:886-914`

```typescript
if (element.type === "remotion") {
  const remotionElement = element as RemotionElement;

  return (
    <RemotionPreview
      elementId={remotionElement.id}
      componentId={remotionElement.componentId}  // ← "built-in-skills-demo"
      inputProps={remotionElement.props}
      showControls={false}
      // ... dimensions
    />
  );
}
```

### Step 2: RemotionPreview Looks Up Component

**File:** `remotion-preview.tsx:109-121`

```typescript
// Get component from store
const component = useRemotionComponent(componentId ?? "");

// Determine the effective component
const effectiveComponent = useMemo(() => {
  if (component) return component;  // ← If store has it
  if (instance) {
    return useRemotionStore
      .getState()
      .registeredComponents.get(instance.componentId);
  }
  return undefined;  // ← If store doesn't have it, returns undefined!
}, [component, instance]);
```

### Step 3: If No Component, Shows "No component selected"

```typescript
// No component available
if (!effectiveComponent) {
  return (
    <div className="flex flex-col items-center justify-center...">
      <AlertCircle />
      <p>No component selected</p>  // ← But we're seeing gradient, not this!
    </div>
  );
}
```

---

## Potential Root Causes

### 1. Store Not Initialized

**Hypothesis:** `initializeRemotionStore()` was never called, so `registeredComponents` is empty.

**Evidence needed:**
```typescript
// Add this debug log
console.log("[RemotionPreview] Store state:", {
  isInitialized: useRemotionStore.getState().isInitialized,
  componentCount: useRemotionStore.getState().registeredComponents.size,
  componentId,
  foundComponent: !!component,
});
```

**File:** `remotion-store.ts:63-80`
```typescript
initialize: async () => {
  // Load built-in components
  const newComponents = new Map(get().registeredComponents);
  for (const definition of builtInComponentDefinitions) {
    newComponents.set(definition.id, definition);  // ← Registers components
  }
  set({ registeredComponents: newComponents, isInitialized: true });
}
```

**Fix Location:** App startup must call `initializeRemotionStore()`

---

### 2. Component Found But isReady Stays False

**Hypothesis:** The loading state is shown indefinitely.

**File:** `remotion-preview.tsx:265-296`
```typescript
// Loading state
if (!isReady && !error) {
  return (
    <div>
      <RemotionPlayerLoading />  // ← Shows spinner
      {/* Hidden player for loading */}
      <div className="absolute inset-0 opacity-0 pointer-events-none">
        <RemotionPlayerWrapper
          onReady={handleReady}  // ← If this never fires, stuck in loading
        />
      </div>
    </div>
  );
}
```

**Potential issue:** The player wrapper is hidden (`opacity-0`), but maybe it's not actually mounting?

---

### 3. Player Wrapper Never Calls onReady

**File:** `player-wrapper.tsx:234-291`

```typescript
// Detect when player ref becomes available
useEffect(() => {
  const checkRef = () => {
    if (playerRef.current && !isPlayerMounted) {
      setIsPlayerMounted(true);
    }
  };
  checkRef();
  const timer = setTimeout(checkRef, 50);  // ← Only checks twice
  return () => clearTimeout(timer);
}, [isPlayerMounted]);

// Once mounted, call onReady
useEffect(() => {
  if (!isPlayerMounted) return;
  // ...
  onReady?.();  // ← Should fire here
}, [isPlayerMounted, ...]);
```

**Potential issue:** If `playerRef.current` is never set (Player component fails to mount), `isPlayerMounted` stays false forever.

---

### 4. Player Component Prop is Invalid

**File:** `player-wrapper.tsx:377-392`

```typescript
<Player
  ref={playerRef}
  component={component.component}  // ← Is this a valid React component?
  inputProps={inputProps}
  durationInFrames={effectiveDuration}
  fps={effectiveFps}
  compositionWidth={compositionWidth}
  compositionHeight={compositionHeight}
  // ...
/>
```

**Skills Demo Definition:**
```typescript
export const SkillsDemoDefinition: RemotionComponentDefinition = {
  id: "built-in-skills-demo",
  component: SkillsDemo as React.ComponentType<Record<string, unknown>>,
  // ...
};
```

**Potential issue:** The cast `as React.ComponentType` might mask a type mismatch.

---

### 5. Gradient Is From a Different Layer

**Observation:** The preview shows a pink/purple gradient. This might be:
- The project background (blur effect?)
- A different element on the timeline
- The RemotionPreview showing something unexpected

**Check:** Is `activeProject?.backgroundType === "blur"` enabled?

---

## Debug Steps

### Step 1: Add Console Logging

Add to `remotion-preview.tsx`:
```typescript
console.log("[RemotionPreview] Debug:", {
  componentId,
  elementId,
  effectiveComponent: effectiveComponent?.id,
  isReady,
  error: error?.message,
});
```

Add to `player-wrapper.tsx`:
```typescript
console.log("[PlayerWrapper] Debug:", {
  elementId,
  componentId: component.id,
  hasComponent: !!component.component,
  isPlayerMounted,
  playerRefSet: !!playerRef.current,
});
```

### Step 2: Verify Store Initialization

Check in browser console:
```javascript
// Check if store is initialized
const store = window.__REMOTION_STORE__;  // If exposed
console.log("Store initialized:", store?.isInitialized);
console.log("Components:", [...store?.registeredComponents.keys()]);
```

Or add to `remotion-store.ts`:
```typescript
// Expose store for debugging (dev only)
if (import.meta.env.DEV) {
  (window as any).__REMOTION_STORE__ = useRemotionStore.getState();
}
```

### Step 3: Check Component Registration

In component browser (Remotion tab), verify:
- "14 components • Remotion" shown at bottom ✓
- Skills Demo appears in list ✓

If components show but preview doesn't work, the issue is in the preview rendering path.

### Step 4: Test with Simpler Component

Try adding a minimal test component:
```typescript
const TestComponent = () => (
  <AbsoluteFill style={{ backgroundColor: 'red' }}>
    <h1>TEST</h1>
  </AbsoluteFill>
);
```

If this works, the issue is in SkillsDemo itself.

---

## Likely Root Cause

Based on the evidence:

1. **Components ARE registered** (UI shows "14 components • Remotion")
2. **Skills Demo IS on timeline** (visible in timeline track)
3. **Preview shows gradient** (not "No component selected" error)

**Most likely:** The `isReady` state is stuck at `false`, showing the loading state with hidden player.

The gradient might be showing through because:
- The loading placeholder has transparent background
- The project has a gradient background enabled

---

## Recommended Fix

### Option A: Increase Mount Detection Timeout

**File:** `player-wrapper.tsx`
```typescript
useEffect(() => {
  const checkRef = () => {
    if (playerRef.current && !isPlayerMounted) {
      setIsPlayerMounted(true);
    }
  };

  checkRef();

  // Check multiple times with increasing delays
  const timers = [
    setTimeout(checkRef, 50),
    setTimeout(checkRef, 100),
    setTimeout(checkRef, 200),
    setTimeout(checkRef, 500),
  ];

  return () => timers.forEach(clearTimeout);
}, [isPlayerMounted]);
```

### Option B: Use Callback Ref Pattern

```typescript
const setPlayerRef = useCallback((node: PlayerRef | null) => {
  playerRef.current = node;
  if (node && !isPlayerMounted) {
    setIsPlayerMounted(true);
  }
}, [isPlayerMounted]);

// Use callback ref
<Player ref={setPlayerRef} ... />
```

### Option C: Add acknowledgeRemotionLicense Prop

**File:** `player-wrapper.tsx`
```typescript
<Player
  ref={playerRef}
  component={component.component}
  acknowledgeRemotionLicense={true}  // ← Removes warning
  // ...
/>
```

---

## Next Steps

1. Add debug logging to identify exact failure point
2. Check browser DevTools → React DevTools to inspect component state
3. Verify `isPlayerMounted` value in React DevTools
4. Check if Player component actually renders in DOM (inspect elements)
5. Test with callback ref pattern if issue persists

---

## Related Files

| File | Purpose |
|------|---------|
| `preview-panel.tsx:886-914` | Renders RemotionPreview for timeline elements |
| `remotion-preview.tsx` | Preview container with loading/error states |
| `player-wrapper.tsx` | Wraps @remotion/player with QCut integration |
| `remotion-store.ts` | Manages component registry and instances |
| `built-in/templates/skills-demo.tsx` | The SkillsDemo component definition |

---

*Investigation document - update with findings as debugging progresses.*
