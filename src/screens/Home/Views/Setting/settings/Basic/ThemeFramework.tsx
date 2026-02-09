/**
 * 主题框架设置组件（简化版，集成到设置页面）
 */

import { memo, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import themeState from '@/store/theme/state'
import themeAction from '@/store/theme/action'
import {
  ThemeFrameworkType,
  THEME_FRAMEWORKS,
  getRecommendedFramework,
} from '@/theme/ThemeFramework'
import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const theme = useTheme()
  const [currentFramework, setCurrentFramework] = useState<ThemeFrameworkType>(
    themeState.framework
  )

  const handleFrameworkChange = async (framework: ThemeFrameworkType) => {
    setCurrentFramework(framework)
    themeAction.setFramework(framework)

    // 保存到设置
    updateSetting({
      'theme.framework': framework,
    })
  }

  const recommendedFramework = getRecommendedFramework()
  const currentFrameworkInfo = THEME_FRAMEWORKS.find(f => f.type === currentFramework)

  return (
    <SubTitle title="主题框架">
      <View style={styles.container}>
        <Text size={13} color={theme['c-font-label']} style={styles.desc}>
          选择应用的设计风格。Material Design 适合 Android，iOS 风格适合 iPhone。
        </Text>

        <View style={styles.buttonRow}>
          {THEME_FRAMEWORKS.map((framework) => {
            const isSelected = currentFramework === framework.type
            const isRecommended = framework.type === recommendedFramework

            return (
              <Button
                key={framework.type}
                onPress={() => handleFrameworkChange(framework.type)}
                style={[
                  styles.button,
                  {
                    backgroundColor: isSelected
                      ? theme['c-primary']
                      : theme['c-button-background'],
                  },
                ]}
              >
                <Text
                  size={13}
                  color={isSelected ? '#FFFFFF' : theme['c-button-font']}
                >
                  {framework.name}
                  {isRecommended ? ' (推荐)' : ''}
                </Text>
              </Button>
            )
          })}
        </View>

        <Text size={12} color={theme['c-font-label']} style={styles.currentInfo}>
          当前：{currentFrameworkInfo?.name} - {currentFrameworkInfo?.description}
        </Text>
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  desc: {
    marginBottom: 12,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  currentInfo: {
    marginTop: 4,
    fontStyle: 'italic',
  },
})
