import { View, Text, StyleSheet } from 'react-native';

interface StarRatingProps {
  stars: number;
  maxStars?: number;
  size?: number;
}

export function StarRating({ stars, maxStars = 3, size = 18 }: StarRatingProps) {
  return (
    <View style={styles.row} accessibilityLabel={`${stars} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Text key={i} style={[styles.star, { fontSize: size, color: i < stars ? '#FFD700' : '#4B5563' }]}>
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  star: { fontWeight: 'bold' },
});
