import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, Animated } from 'react-native';
import { Player } from '../models/Player';
import { Card } from '../models/Card';
import { CardView } from './CardView';

const { width } = Dimensions.get('window');

interface PlayerHandProps {
  player: Player;
  onCardSelect: (card: Card | null) => void;
  selectedCard: Card | null;
  onReorderCards?: (newOrder: Card[]) => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ player, onCardSelect, selectedCard, onReorderCards }) => {
  const [cardOrder, setCardOrder] = useState<Card[]>(player.hand);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragPosition = useRef(new Animated.ValueXY()).current;

  // Update card order when player hand changes
  React.useEffect(() => {
    setCardOrder(player.hand);
  }, [player.hand]);

  const cardWidth = 70;
  const cardSpacing = 30;
  const maxSpread = width - 40;
  const totalCards = cardOrder.length;
  const spreadWidth = Math.min(maxSpread, cardWidth + (totalCards - 1) * cardSpacing);
  const startX = (width - spreadWidth) / 2;

  const getCardPosition = (index: number) => {
    const progress = index / Math.max(1, totalCards - 1);
    return startX + progress * (spreadWidth - cardWidth);
  };

  const createPanResponder = (index: number) => {
    let hasDragged = false;
    
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        console.log('Grant - touching card', index);
        hasDragged = false;
        dragPosition.setValue({ x: 0, y: 0 });
        
        // INSTANT toggle on touch down
        const card = cardOrder[index];
        const isCurrentlySelected = selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;
        
        if (isCurrentlySelected) {
          console.log('Deselecting card instantly');
          onCardSelect(null);
        } else {
          console.log('Selecting card instantly', card);
          onCardSelect(card);
        }
      },
      
      onPanResponderMove: (_evt, gestureState) => {
        // Only start dragging if moved significantly (20px threshold)
        if (Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20) {
          hasDragged = true;
          setDraggingIndex(index);
          dragPosition.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },
      
      onPanResponderRelease: (_evt, gestureState) => {
        if (!hasDragged) {
          // Just a tap - already selected on grant
          setDraggingIndex(null);
          dragPosition.setValue({ x: 0, y: 0 });
          return;
        }
        
        // Was dragging - find where to insert
        const finalX = getCardPosition(index) + gestureState.dx;
        let targetIndex = index;
        let minDist = Infinity;
        
        for (let i = 0; i < totalCards; i++) {
          const pos = getCardPosition(i);
          const dist = Math.abs(finalX - pos);
          if (dist < minDist) {
            minDist = dist;
            targetIndex = i;
          }
        }
        
        // Reorder if position changed
        if (targetIndex !== index) {
          const newOrder = [...cardOrder];
          const [movedCard] = newOrder.splice(index, 1);
          newOrder.splice(targetIndex, 0, movedCard);
          setCardOrder(newOrder);
          if (onReorderCards) {
            onReorderCards(newOrder);
          }
        }
        
        // Snap back with animation
        Animated.spring(dragPosition, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 80,
          friction: 8,
        }).start(() => {
          setDraggingIndex(null);
        });
      },
    });
  };

  return (
    <View style={styles.container}>
      {cardOrder.map((card, index) => {
        const progress = index / Math.max(1, totalCards - 1);
        const baseX = getCardPosition(index);
        const rotateAngle = -15 + progress * 30;
        const baseY = Math.sin(progress * Math.PI) * 20;
        const panResponder = createPanResponder(index);

        const isDragging = draggingIndex === index;
        const isSelected = selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;
        
        // Raise selected card
        const raiseY = isSelected && !isDragging ? -30 : 0;

        const animatedStyle = isDragging ? {
          transform: [
            { translateX: Animated.add(baseX, dragPosition.x) },
            { translateY: Animated.add(-baseY + raiseY, dragPosition.y) },
            { rotate: `0deg` }, // Straighten when dragging
            { scale: 1.15 },
          ],
        } : {
          transform: [
            { translateX: baseX },
            { translateY: -baseY + raiseY },
            { rotate: `${rotateAngle}deg` },
            { scale: isSelected ? 1.05 : 1 },
          ],
        };

        return (
          <Animated.View
            key={`${card.suit}-${card.rank}`}
            {...panResponder.panHandlers}
            style={[
              styles.card,
              animatedStyle,
              {
                zIndex: isDragging ? 1000 : (isSelected ? 999 : index),
              },
            ]}
            pointerEvents="box-only"
          >
            <View pointerEvents="none">
              <CardView
                card={card}
                onPress={() => {}}
                selected={isSelected}
              />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  card: {
    position: 'absolute',
    bottom: 20,
  },
});

