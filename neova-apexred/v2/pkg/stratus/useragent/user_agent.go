package useragent

import (
	"fmt"

	"github.com/google/uuid"
)

// Has to be in a separate package to avoid circular dependencies

const StratusUserAgentPrefix = "neova-apexred"

func GetStratusUserAgentForUUID(uuid uuid.UUID) string {
	return fmt.Sprintf("%s_%s", StratusUserAgentPrefix, uuid.String())
}
